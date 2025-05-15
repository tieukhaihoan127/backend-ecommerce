const mongoose = require("mongoose");
const generate = require("../helpers/generate");

const userSchema = new mongoose.Schema(
    {
        email: String,
        fullName: String,
        password: String,
        shippingAddress: {
            city: String,
            district: String,
            ward: String,
            address: String
        },
        imageUrl: {
            type: String,
            default: "sdfds"
        },
        token: {
            type: String,
            default: () => generate.generateRandomString(20)
        },
        status: {
            type: String,
            default: "Active"
        },
        loyaltyPoint: {
            type: Number,
            default: 0.0
        },
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

const User = mongoose.model('User', userSchema, "users");

module.exports = User;