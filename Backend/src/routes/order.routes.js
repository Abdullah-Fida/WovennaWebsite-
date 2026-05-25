const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getUserOrders
 
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware.js');

// All routes require authentication

router.post("/create", protect, createOrder);

router.get("/my-orders", protect, getUserOrders);
router.get("/:id", protect, getOrderById);

module.exports = router;