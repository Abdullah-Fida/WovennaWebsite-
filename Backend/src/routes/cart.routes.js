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
router.put('/:productId', updateCartItem);
router.delete('/:productId', deleteCartItem);
router.delete('/clear', clearCart);

module.exports = router;