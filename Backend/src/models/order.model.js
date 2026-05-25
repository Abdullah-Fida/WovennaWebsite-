const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    items: [
      {
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
        image: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ],
    shippingAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true,
        default: "India"
      },
      zipCode: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      }
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD"
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending"
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing"
    },
    totalAmount: {
      type: Number,
      required: true
    },
    shippingCharges: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);