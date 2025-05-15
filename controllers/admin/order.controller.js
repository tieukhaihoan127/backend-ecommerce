const Order = require("../../models/order.model");
const Product = require("../../models/product.model");
const moment = require("moment");

//[GET] /order/:status
module.exports.index = async (req, res) => {

    const status = req.params.status ?? "";

    const now = moment();

    const find = {
        deleted: false
    };

    if(status == "All") {
        deleted: false
    }
    else if(status == "Today") {
        find.createdAt = {
            $gte: now.clone().startOf("day").toDate(),
            $lte: now.clone().endOf("day").toDate(),
        };
    }
    else if(status == "Yesterday") {
        find.createdAt = {
            $gte: now.clone().subtract(1, "day").startOf("day").toDate(),
            $lte: now.clone().subtract(1, "day").endOf("day").toDate(),
        };
    }
    else if(status == "Week") {
        find.createdAt = {
            $gte: now.clone().startOf("week").toDate(),
            $lte: now.clone().endOf("week").toDate(),
        };
    }
    else if(status == "Month") {
        find.createdAt = {
            $gte: now.clone().startOf("month").toDate(),
            $lte: now.clone().endOf("month").toDate()
        };
    }
    else if(status == "Custom") {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);

        find.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments(find);

    const orders = await Order.find(find).sort({ createdAt: -1 }).skip(skip).limit(limit);

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
            total = total - order.couponPoint;
        }

        let latestStatus = null;
        if (order.history && order.history.length > 0) {
            const sortedHistory = order.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            latestStatus = sortedHistory[0];
        }

        const orderObject = {
            orderId: order.id,
            totalAmount: total,
            latestStatus: latestStatus?.status || 'Unknown',
            latestUpdatedAt: order.createdAt,
        };

        orderInfo.push(orderObject);
    }


    return res.status(200).json({
        order: orderInfo,
        totalPages: Math.ceil(totalOrders / limit)
    });

}

//[GET] /order/detail/:id
module.exports.detail = async (req, res) => {

    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId });

    let total = 0;

    for (const item of order.products) {
        let discountedPrice;

        if(item.discountPercentage > 0) {
            discountedPrice = item.price - (item.price * item.discountPercentage / 100);
        }
        else {
            discountedPrice = item.price;
        }

        total += (discountedPrice * item.quantity);
    }

    const enrichedProducts = [];

    for (const product of order.products) {
        const productInfo = await Product.findOne({
            _id: product.product_id,
        }).select("price discountPercentage color variant title thumbnail");

        let thumbnail = productInfo.thumbnail;
        let discountedPrice = product.price - (product.price * product.discountPercentage / 100);

        if (productInfo.color !== product.color) {
            const variantMatch = productInfo.variant.find(v => v.color == product.color);
            if (variantMatch) {
                thumbnail = variantMatch.thumbnail;
            }
        }

        enrichedProducts.push({
            ...product.toObject(), 
            title: productInfo.title,
            thumbnail: thumbnail,
            priceNew: discountedPrice
        });
    }

    const sortedHistory = order.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
        order: {
            orderId: order.id,
            totalPrice: total,
            products: enrichedProducts,
            userInfo: order.userInfo,
            taxes: order.taxes,
            shippingFee: order.shippingFee,
            loyaltyPoint: order.loyaltyPoint,
            couponPoint: order.couponPoint,
            createdDate: order.createdAt,
            status: sortedHistory[0]["status"]
        }
    });

}

//[PATCH] /order/changeStatus/:id/:status
module.exports.changeStatus = async (req, res) => {

    const orderId = req.params.id;
    const status = req.params.status;

    const order = await Order.findOne({ _id: orderId });

    if(!order) {
        return res.status(400).json({ error: "Không tồn tại đơn hàng" });
    }

    order.history.push({
        status: status,
        updatedAt: Date.now()
    });

    await order.save();


    return res.status(200).json({
        message: "Cập nhật trạng thái đơn hàng thành công"
    });

}