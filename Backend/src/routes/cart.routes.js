// routes/cart.routes.js
const express = require('express');
const router = express.Router();
const { 
  addToCart, 
  getCart, 
  updateCartItem, 
  deleteCartItem, 
  clearCart 
} = require('../controllers/cart.controller.js');
const { protect } = require('../middleware/auth.middleware.js');

// All routes require authentication
router.use(protect);

router.post('/add', addToCart);
router.get('/', getCart);
// Static routes MUST come before parameterized routes
// so Express doesn't match "clear" as a :productId
router.delete('/clear', clearCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', deleteCartItem);

module.exports = router;