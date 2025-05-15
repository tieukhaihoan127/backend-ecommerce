const Review = require("../../models/review.model");

// [GET] /review/:productId
module.exports.index = async (req, res) => {
    try {

        const productId = req.params.productId;

        const reviews = await Review.find({ product_id: productId }).sort({ createdAt: -1 });

        if(reviews) {
            res.status(200).json({
                reviews: reviews
            });
        }
        else {
            res.status(200).json({
                reviews: []
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};

// [POST] /review/add
module.exports.addReview = async (req, res) => {
    try {
        const review = req.body.comment;
        const productId = req.body.productId;

        const newReview = new Review({
            product_id: productId,
            message: review
        });

        await newReview.save();

        return res.status(201).json({
            review: newReview,
            message: "Đã thêm lời đánh giá thành công!"
        });

    } catch (error) {
        
    }
}
