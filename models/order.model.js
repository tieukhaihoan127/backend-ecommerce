const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: String,
    userInfo: {
      fullName: String,
      email: String,
      phone: String,
      city: String,
      district: String,
      ward: String,
      address: String
    },
    products: [
      {
        product_id: String,
        color: String,
        price: Number,
        discountPercentage: Number,
        quantity: Number
      }
    ],
    taxes: Number,
    shippingFee: Number,
    loyaltyPoint: Number,
    couponPoint: Number,
    history: [
      {
        status: String,
        updatedAt: {
          type: Date, 
          default: Date.now
        }
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema, "orders");

module.exports = Order;