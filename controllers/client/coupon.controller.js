const Coupon = require("../../models/coupon.model");

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
