const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const productSchema = new mongoose.Schema(
    {
        title: String,
        category: String,
        brand: String,
        description: String,
        price: Number,
        discountPercentage: Number,
        stock: Number,
        thumbnail: String,
        images: [String],
        status: String,
        featured: Boolean,
        bestSellers: Boolean,
        sku: String,
        color: String,
        deleted: {
            type: Boolean,
            default: false
        },
        position: Number,
        variant: [
            {
                color: String,
                thumbnail: String,
                carousel: [String],
                price: Number,
                discountPercentage: Number,
                sku: String,
                stock:Number
            }
        ],
        slug: {
            type: String,
            slug: "title",
            unique: true 
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

const Product = mongoose.model('Product', productSchema, "products");

module.exports = Product;