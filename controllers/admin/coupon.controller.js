const Coupon = require("../../models/coupon.model");
const Order = require("../../models/order.model");
const Product = require("../../models/product.model");

// [GET] /coupon/
module.exports.index = async (req, res) => {
    try {

        const coupons = await Coupon.find({
            deleted: false,
            stock: { $gt: 0 }
        });

        if(!coupons) {
            res.status(200).json({
                coupons: []
            });
        }
        

        res.status(200).json({
            coupons: coupons
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};


// [GET] /coupon/:couponId
module.exports.couponOrders = async (req, res) => {
    try {

        const couponId = req.params.couponId;

        const coupons = await Coupon.findOne({
            _id: couponId
        });

        const orders = await Order.find({ _id: { $in: coupons.orderUsed } }).sort({ createdAt: -1 });

        const orderInfo = [];

        for(const order of orders) {
            let total = 0;
            for (const item of order.products) {
                const discountedPrice = item.price - (item.price * item.discountPercentage / 100);
                total += (discountedPrice * item.quantity);
            }

            if((total + ((total*order.taxes)/100) + order.shippingFee) > order.loyaltyPoint) {
                total = total + ((total*order.taxes)/100) + order.shippingFee - order.loyaltyPoint;
            }
            else {
                total = 0;
            }

            if(order.couponPoint > 0) {
                total = total - ((total * order.couponPoint)/100);
            }

            let latestStatus = null;
            if (order.history && order.history.length > 0) {
                const sortedHistory = order.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                latestStatus = sortedHistory[0];
            }

        const enrichedProducts = [];

        for (const product of order.products) {
            const productInfo = await Product.findOne({
                _id: product.product_id,
            }).select("price discountPercentage color variant title thumbnail");

            let thumbnail = productInfo.thumbnail;

            if (productInfo.color !== product.color) {
                const variantMatch = productInfo.variant.find(v => v.color == product.color);
                if (variantMatch) {
                    thumbnail = variantMatch.thumbnail;
                }
            }

            enrichedProducts.push({
                ...product.toObject(), 
                title: productInfo.title,
                thumbnail: thumbnail
            });
        }

            const orderObject = {
                orderId: order.id,
                product: enrichedProducts,
                totalAmount: total,
                latestStatus: latestStatus?.status || 'Unknown',
                latestUpdatedAt: latestStatus?.updatedAt || null,
            };

            orderInfo.push(orderObject);
        }


        return res.status(200).json({
            order: orderInfo
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};

// [POST] /coupon/add
module.exports.addCoupon = async (req, res) => {
    try {

        const code = req.body.code;
        const discount = req.body.discount;
        const stock = req.body.stock;

        const newCoupon = 
        {
            code: code,
            discount: discount,
            stock: stock,
            numberUsed: 0,
            orderUsed: []
        }

        const coupon = new Coupon(newCoupon);
        await coupon.save();

        

        res.status(201).json({
            message: "Tạo mã coupon thành công!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};
