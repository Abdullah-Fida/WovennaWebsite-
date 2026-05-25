const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');
const { createProduct, getProducts, getProduct, updateProduct, deleteProduct } = require('../controllers/admin.product.controller');
const { getAllOrders, updateOrderStatus, getDashboardStats, getAllUsers } = require('../controllers/admin.order.controller');

// multer setup - use memory storage so we can upload files to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// dashboard
router.get('/stats', protect, isAdmin, getDashboardStats);

// users
router.get('/users', protect, isAdmin, getAllUsers);

// product routes
router.get('/products', protect, isAdmin, getProducts);
router.post('/products', protect, isAdmin, upload.array('images', 6), createProduct);
router.get('/products/:id', protect, isAdmin, getProduct);
router.put('/products/:id', protect, isAdmin, upload.array('images', 6), updateProduct);
router.delete('/products/:id', protect, isAdmin, deleteProduct);

// orders
router.get('/orders', protect, isAdmin, getAllOrders);
router.put('/orders/:id/status', protect, isAdmin, updateOrderStatus);

module.exports = router;
