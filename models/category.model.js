const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: String,
    imageUrl: String,
    deleted: {
      type: Boolean,
      default: false
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
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema, "categories");

module.exports = Category;