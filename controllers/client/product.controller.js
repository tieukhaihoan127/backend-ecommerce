const mongoose = require('mongoose');
const Product = require("../../models/product.model");
const Rating = require("../../models/rating.model");
const Order = require("../../models/order.model");
const client = require("../../config/elasticsearch");

// [GET] /admin/products/:status
module.exports.index = async (req, res) => {
    try {
        let bestSellingIds = [];
        const status = req.params.status ?? "";
        let find = {
            stock: { $gt: 0 }
        };

        if(status == "" || status == "All"){
            find.deleted = false;
        }
        else if(status == "Promotional Products") {
            find.deleted = false;
            find.discountPercentage = { $gt: 0.0 };
        }
        else if(status == "New Products") {
            find.deleted = false;
            find.featured = true;
        }
        else if(status == "Best Sellers") {
            find.deleted = false;
            const bestSelling = await Order.aggregate([
                { $unwind: "$products" },
                {
                  $group: {
                    _id: "$products.product_id",
                    totalQuantitySold: { $sum: "$products.quantity" }
                  }
                },
                { $sort: { totalQuantitySold: -1 } }
              ]);

            bestSellingIds = bestSelling.map(p => new mongoose.Types.ObjectId(p._id));
            if (bestSellingIds.length === 0) {
                return res.status(200).json({ products: [] });
            }
            find._id = { $in: bestSellingIds };
        }
        else {
            find.deleted = false;
            find.category = status;
        }
    
        const products  = await Product.find(find).limit(8);

        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const ratings = await Rating.find({ productId: product.id });

            if(ratings) {
                let averageRating = 0;
                if (ratings.length > 0) {
                    const total = ratings.reduce((sum, r) => sum + r.star, 0);
                    averageRating = total / ratings.length;
                }

                return {
                    ...product._doc,
                    averageRating: parseFloat(averageRating.toFixed(1)),
                };
            }
            else {
                return {
                    ...product._doc,
                    averageRating: 0,
                }
            }
        }));
    
        res.status(200).json({
            products: productsWithRatings
        });

    } catch (error) {
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }  
} 

// [GET] /admin/products/pages/:status
module.exports.page = async (req, res) => {
    try {
        const status = req.params.status ?? "";

        let find = {
            deleted: false
        };

        let sort = {};
        let useAggregation = false;
        let sortDirection = 1;
        let ids;
        let products;
        let bestSellingIds = [];
        const priceRangeStart = parseFloat(req.query.priceStart);
        const priceRangeEnd = parseFloat(req.query.priceEnd);
        const ratingRangeStart = parseFloat(req.query.ratingStart);
        const ratingRangeEnd = parseFloat(req.query.ratingEnd);
        const hasPriceFilter = !isNaN(priceRangeStart) && !isNaN(priceRangeEnd);
        const hasRatingFilter = !isNaN(ratingRangeStart) && !isNaN(ratingRangeEnd);

        // Query Status
        if(status == "" || status == "All"){
            find.deleted = false;
        }
        else if(status == "Promotional Products") {
            find.deleted = false;
            find.discountPercentage = { $gt: 0.0 };
        }
        else if(status == "New Products") {
            find.deleted = false;
            find.featured = true;
        }
        else if(status == "Best Sellers") {
            find.deleted = false;
            find.bestSellers = true;
        }
        else {
            find.deleted = false;
            find.category = status;
        }

        //Sort
        if(req.query.sortById) {
            if(req.query.sortById == "1") {
                sort.title = 1;
            }
            else if(req.query.sortById == "2") {
                sort.title = -1;
            }
            else if(req.query.sortById == "3") {
                sortDirection = 1;
                useAggregation = true;
            }
            else if(req.query.sortById == "4") {
                sortDirection = -1;
                useAggregation = true;
            }
            else if(req.query.sortById == "5") {
                sort.discountPercentage = -1
            }
            else if(req.query.sortById == "6") {

                const bestSelling = await Order.aggregate([
                    { $unwind: "$products" },
                    {
                      $group: {
                        _id: "$products.product_id",
                        totalQuantitySold: { $sum: "$products.quantity" }
                      }
                    },
                    { $sort: { totalQuantitySold: -1 } }
                  ]);

                bestSellingIds = bestSelling.map(p => new mongoose.Types.ObjectId(p._id));
                if (bestSellingIds.length === 0) {
                    return res.status(200).json({ products: [] });
                }
                find._id = { $in: bestSellingIds };
            }
        }
        

        //Brands
        if(req.query.brand) {
            if (Array.isArray(req.query.brand)) {
                find.brand = { $in: req.query.brand };
            }
            else if (typeof req.query.brand === 'string') {
                find.brand = { $in: [req.query.brand] };
            }
        }

        //Elastic Search
        if (req.query.search) {
            const searchTerm = req.query.search;
            const { hits } = await client.search({
              index: 'products',
              query: {
                bool: {
                  must: [
                    {
                      multi_match: {
                        query: searchTerm,
                        fields: ['title^3', 'brand'],
                        fuzziness: 'AUTO'
                      }
                    }
                  ],
                  filter: []
                }
              }
            });

            // ids = hits.hits.map(hit => hit._id);
            ids = hits.hits.map(hit => new mongoose.Types.ObjectId(hit._id));

            if (ids.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy kết quả phù hợp!" });
            }

            find._id = { $in: ids };
        }

        if (useAggregation) {
            const pipeline = [
                { $match: find },
                {
                    $addFields: {
                        priceAfterDiscount: {
                            $cond: [
                                { $gt: ["$discountPercentage", 0] },
                                {
                                    $multiply: [
                                        "$price",
                                        { $subtract: [1, { $divide: ["$discountPercentage", 100] }] }
                                    ]
                                },
                                "$price"
                            ]
                        }
                    }
                }
            ];

            if (hasPriceFilter) {
                pipeline.push({
                    $match: {
                        priceAfterDiscount: {
                            $gte: priceRangeStart,
                            $lte: priceRangeEnd
                        }
                    }
                });
            }

            if (req.query.sortById === "3" || req.query.sortById === "4") {
                pipeline.push({ $sort: { priceAfterDiscount: sortDirection } });
            }

            products = await Product.aggregate(pipeline);
        } else {

            if(hasPriceFilter) {
                const pipeline = [
                    { $match: find },
                    {
                        $addFields: {
                            priceAfterDiscount: {
                                $cond: [
                                    { $gt: ["$discountPercentage", 0] },
                                    {
                                        $multiply: [
                                            "$price",
                                            { $subtract: [1, { $divide: ["$discountPercentage", 100] }] }
                                        ]
                                    },
                                    "$price"
                                ]
                            }
                        }
                    }
                ];
    
                pipeline.push({
                    $match: {
                        priceAfterDiscount: {
                            $gte: priceRangeStart,
                            $lte: priceRangeEnd
                        }
                    }
                });

                if (Object.keys(sort).length > 0) {
                    pipeline.push({ $sort: sort });
                }
    
                products = await Product.aggregate(pipeline);
            }
            else {
                products = await Product.find(find).sort(sort);
            }
        }

        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const ratings = await Rating.find({ productId: product._id });

            if(ratings) {
                let averageRating = 0;
                if (ratings.length > 0) {
                    const total = ratings.reduce((sum, r) => sum + r.star, 0);
                    averageRating = total / ratings.length;
                }

                return {
                    ...(hasPriceFilter ? product : product._doc),
                    averageRating: parseFloat(averageRating.toFixed(1)),
                };
            }
            else {
                return {
                    ...(hasPriceFilter ? product : product._doc),
                    averageRating: 0,
                }
            }
        }));

        let filteredProducts = productsWithRatings;
        if (hasRatingFilter) {
            filteredProducts = filteredProducts.filter(p => 
                p.averageRating >= ratingRangeStart && p.averageRating <= ratingRangeEnd
            );
        }
    
        res.status(200).json({
            products: filteredProducts
        });

    } catch (error) {
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }  
} 