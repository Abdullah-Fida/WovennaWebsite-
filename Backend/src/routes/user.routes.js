// routes/user.routes.js - CORRECTED VERSION
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  verifyAuth // Make sure this is imported
} = require("../controllers/user.controller");
const { protect, optionalAuth } = require("../middleware/auth.middleware.js");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.post("/logout", logoutUser);
router.get("/me", protect, getProfile);
// Optional auth: guests get { authenticated: false } instead of a 401 error.
router.get("/verify", optionalAuth, verifyAuth);
router.put("/profile", protect, updateProfile);

module.exports = router;