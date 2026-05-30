// src/controllers/user.controller.js

// 🔹 All imports MUST be at the top
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model.js");
const { createSession, deleteSession } = require("../utils/sessionStore");

// ----------------------
// REGISTER USER
// ----------------------
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    message: "User registered successfully",
  });
});

// ----------------------
// LOGIN USER
// ----------------------
// controllers/user.controller.js - Update login function
// Add to user.controller.js
const verifyAuth = asyncHandler(async (req, res) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } else {
    res.status(401).json({ authenticated: false, message: "Not authenticated" });
  }
});

// Add to routes
// In user.routes.js

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body; // Remove role from here

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // ✅ Create session token
  const sessionToken = createSession(user._id);

  // Send token as HttpOnly cookie
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("sessionToken", sessionToken, {
    httpOnly: true,
    secure: isProd,
    // For cross-site frontend+backend (deployed on different domains),
    // cookies must be `SameSite=None` and `Secure`.
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // Also return user data including role in response
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    message: "Logged in successfully",
    // Send token in response for frontend to store
    token: sessionToken
  });
});

// ----------------------
// LOGOUT USER
// ----------------------
const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies.sessionToken;
  if (token) deleteSession(token);

  res.clearCookie("sessionToken");
  res.json({ message: "Logged out successfully" });
});

// ----------------------
// GET USER PROFILE
// ----------------------
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

// ----------------------
// UPDATE USER PROFILE
// ----------------------
const updateProfile = asyncHandler(async (req, res) => {
  const { phone, address } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.phone = phone || user.phone;
  user.address = address || user.address;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    address: updatedUser.address,
    role: updatedUser.role,
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  verifyAuth
};
