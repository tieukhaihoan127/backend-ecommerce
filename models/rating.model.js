const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        userId: String,
        productId: String,
        star: Number,
        comment: String,
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

const Rating = mongoose.model('Rating', ratingSchema, "ratings");

module.exports = Rating;