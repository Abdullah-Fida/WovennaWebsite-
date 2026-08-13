const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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
        // Products without a photo must still be orderable.
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
        default: "Pakistan"
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
    },
    promoCode: {
      type: String,
      default: null
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    guestName: {
      type: String,
      default: null
    },
    guestEmail: {
      type: String,
      default: null
    },

    // Influencer attribution. Both are stamped at order time so a later
    // change to the influencer's rate never rewrites what they already earned.
    referralCode: {
      type: String,
      default: null,
      uppercase: true,
      index: true
    },
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer',
      default: null
    },
    commissionAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);