const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    phone: String,

    address: {
      street: String,
      city: String,
      country: String,
      zipCode: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ Fix OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
