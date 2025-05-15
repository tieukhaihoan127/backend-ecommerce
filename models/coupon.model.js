const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    discount: Number,
    code: String,
    stock: Number,
    numberUsed: Number,
    orderUsed: [String],
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

const Coupon = mongoose.model("Coupon", couponSchema, "coupons");

module.exports = Coupon;