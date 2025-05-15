const Rating = require("../../models/rating.model");
const User = require("../../models/user.model");

// [GET] /rating/:productId
module.exports.index = async (req, res) => {
    try {
        const productId = req.params.productId;

        const ratings = await Rating.find({ productId: productId }).sort({ createdAt: -1 });

        const ratingResponse = await Promise.all(
            ratings.map(async (rating) => {
                const user = await User.findOne({ _id: rating.userId }).select("imageUrl fullName");

                return {
                    imageUrl: user?.imageUrl || null,
                    name: user?.fullName || "Người dùng không xác định",
                    rating: rating.star,
                    comment: rating.comment,
                    createdDate: rating.createdAt
                };
            })
        );

        res.status(200).json({
            ratings: ratingResponse
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};

// [POST] /rating/add
module.exports.addRating = async (req, res) => {
    try {
        const review = req.body.comment;
        const productId = req.body.productId;
        const tokenId = req.body.tokenId;
        const rating = req.body.star;

        const user = await User.findOne({ token: tokenId });

        if(!user) {
            res.status(400).json({ error: "Không tồn tại người dùng" });
        }

        const newRating = new Rating({
            productId: productId,
            userId: user.id,
            comment: review,
            star: rating
        });

        await newRating.save();

        const ratingInfo = 
        {
            imageUrl: user?.imageUrl || null,
            name: user?.fullName || "Người dùng không xác định",
            rating: newRating.star,
            comment: newRating.comment,
            createdDate: newRating.createdAt
        }

        return res.status(201).json({
            rating: ratingInfo,
            message: "Đã thêm lời đánh giá thành công!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
}
