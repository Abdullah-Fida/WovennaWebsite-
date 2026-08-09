const express = require('express');
const router = express.Router();
const {
  createOrder,
  createGuestOrder,
  trackOrder,
  getOrderById,
  getUserOrders

} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware.js');

// Guest order creation (no auth required)
router.post("/guest-create", createGuestOrder);

// Authenticated order creation
router.post("/create", protect, createOrder);

router.get("/my-orders", protect, getUserOrders);

// Public tracking for guests: order number + email. Declared before "/:id"
// so the literal path is not swallowed by the id parameter.
router.post("/track", trackOrder);

// Order by ID - uses optional auth (handled in controller)
router.get("/:id", getOrderById);

module.exports = router;