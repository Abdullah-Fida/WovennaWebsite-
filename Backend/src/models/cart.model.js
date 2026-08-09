// models/cart.model.js
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    // Products without an uploaded photo must still be addable to the cart.
    image: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  { timestamps: true }
);

// One line per product + variant combination.
cartSchema.index({ user: 1, productId: 1, color: 1, size: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
