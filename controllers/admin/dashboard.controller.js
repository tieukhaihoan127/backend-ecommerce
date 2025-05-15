const Order = require("../../models/order.model");
const User = require("../../models/user.model");
const Product = require("../../models/product.model");
const moment = require("moment");

//[GET] /dashboard/:status
module.exports.index = async (req, res) => {

    const status = req.params.status ?? "";

    const now = moment();

    const find = {
        deleted: false
    };

    const totalUser = await User.countDocuments({ loyaltyPoint: { $gte: 0 } });

    const newUser = await User.countDocuments({ createdAt: {
        $gte: now.clone().startOf("month").toDate(),
        $lte: now.clone().endOf("month").toDate()
    }});

    const totalOrder = await Order.countDocuments(find);

    const totalProductsSold = await Order.aggregate([
        { $match: find },
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.product_id",
                totalQuantitySold: { $sum: "$products.quantity" }
            }
        }
    ]);

    let totalSold = 0;

    for (const p of totalProductsSold) {
        if (p.totalQuantitySold > totalSold) {
            totalSold = p.totalQuantitySold;
        }
    }


    const orders = await Order.find(find);

    let revenue = 0;

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

        revenue = revenue + total;
    }

    const revenueList = [];
    const orderCountList = [];

    function calculateOrderTotal(order) {
        let total = 0;
        for (const item of order.products) {
            const discountedPrice =
                item.price - (item.price * item.discountPercentage) / 100;
            total += discountedPrice * item.quantity;
        }

        if (total + (total * order.taxes) / 100 + order.shippingFee > order.loyaltyPoint) {
            total = total + (total * order.taxes) / 100 + order.shippingFee - order.loyaltyPoint;
        } else {
            total = 0;
        }

        if (order.couponPoint > 0) {
            total = total - order.couponPoint;
        }

        return total;
    }

    if (status === "Week") {
        for (let i = 0; i < 7; i++) {
            const dayStart = now.clone().startOf("week").add(i, "days");
            const dayEnd = dayStart.clone().endOf("day");

            const dayOrders = orders.filter(order =>
                moment(order.createdAt).isBetween(dayStart, dayEnd, undefined, '[]')
            );

            orderCountList.push(dayOrders.length);
            revenueList.push(dayOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0));
        }
    } else if (status === "Month") {
        for (let i = 0; i < 12; i++) {
            const monthStart = now.clone().startOf("year").add(i, "months");
            const monthEnd = monthStart.clone().endOf("month");

            const monthOrders = orders.filter(order =>
                moment(order.createdAt).isBetween(monthStart, monthEnd, undefined, '[]')
            );

            orderCountList.push(monthOrders.length);
            revenueList.push(monthOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0));
        }
    } else if (status === "Quarter") {
        for (let i = 0; i < 4; i++) {
            const quarterStart = now.clone().startOf("year").add(i * 3, "months");
            const quarterEnd = quarterStart.clone().add(2, "months").endOf("month");

            const quarterOrders = orders.filter(order =>
                moment(order.createdAt).isBetween(quarterStart, quarterEnd, undefined, '[]')
            );

            orderCountList.push(quarterOrders.length);
            revenueList.push(quarterOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0));
        }
    } else if (status === "Custom") {
            const startDate = moment(new Date(req.query.startDate)).startOf("day");
            const endDate = moment(new Date(req.query.endDate)).endOf("day");
            const totalDays = endDate.diff(startDate, "days") + 1;

            for (let i = 0; i < totalDays; i++) {
                const day = startDate.clone().add(i, "days");
                const dayStart = day.clone().startOf("day");
                const dayEnd = day.clone().endOf("day");

                const dayOrders = orders.filter(order =>
                    moment(order.createdAt).isBetween(dayStart, dayEnd, undefined, '[]')
                );

                orderCountList.push(dayOrders.length);
                revenueList.push(dayOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0));
            }
        }


    return res.status(200).json({
        totalUser: totalUser,
        newUser: newUser,
        totalOrders: totalOrder,
        revenue: revenue,
        totalBestSellingSold: totalSold,
        orderCountList: orderCountList,
        revenueList: revenueList,
    });

}