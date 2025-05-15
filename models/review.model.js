const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        product_id: String,
        message: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        deletedAt: {
            type: Date,
            default: Date.now
        },
    },
    {
        timestamps: true
    }
);

const Review = mongoose.model('Review', reviewSchema, "reviews");

module.exports = Review;