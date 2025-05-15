const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user_id: { 
      type: String, 
      default: null 
    }, 
    session_id: { 
      type: String, 
      default: null 
    },
    products: [
      {
        product_id: String,
        color: String,
        quantity: Number
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema, "carts");

module.exports = Cart;