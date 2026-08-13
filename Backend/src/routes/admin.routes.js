const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');
const { createProduct, getProducts, getProduct, updateProduct, deleteProduct } = require('../controllers/admin.product.controller');
const { getAllOrders, updateOrderStatus, getDashboardStats, getAllUsers, toggleUserStatus } = require('../controllers/admin.order.controller');
const { createPromo, getPromos, getPromo, updatePromo, deletePromo } = require('../controllers/admin.promo.controller');
const {
  listInfluencers,
  setInfluencerStatus,
  recordPayout,
  listGalleryPosts,
  setGalleryPostStatus,
  deleteGalleryPost
} = require('../controllers/admin.influencer.controller');

// multer setup - use memory storage so we can upload files to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Multer error handling wrapper
const handleMulterUpload = (fieldName, maxCount) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB per image.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Too many files. Maximum 20 images allowed.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ message: err.message || 'File upload failed' });
      }
      next();
    });
  };
};

// dashboard
router.get('/stats', protect, isAdmin, getDashboardStats);

// users
router.get('/users', protect, isAdmin, getAllUsers);
router.put('/users/:id/toggle-status', protect, isAdmin, toggleUserStatus);

// product routes
router.get('/products', protect, isAdmin, getProducts);
router.post('/products', protect, isAdmin, handleMulterUpload('images', 20), createProduct);
router.get('/products/:id', protect, isAdmin, getProduct);
router.put('/products/:id', protect, isAdmin, handleMulterUpload('images', 20), updateProduct);
router.delete('/products/:id', protect, isAdmin, deleteProduct);

// orders
router.get('/orders', protect, isAdmin, getAllOrders);
router.put('/orders/:id/status', protect, isAdmin, updateOrderStatus);

// promos
router.get('/promos', protect, isAdmin, getPromos);
router.post('/promos', protect, isAdmin, createPromo);
router.get('/promos/:id', protect, isAdmin, getPromo);
router.put('/promos/:id', protect, isAdmin, updatePromo);
router.delete('/promos/:id', protect, isAdmin, deletePromo);

// influencer program
router.get('/influencers', protect, isAdmin, listInfluencers);
router.put('/influencers/:id/status', protect, isAdmin, setInfluencerStatus);
router.post('/influencers/:id/payout', protect, isAdmin, recordPayout);

// influencer gallery submissions
router.get('/gallery', protect, isAdmin, listGalleryPosts);
router.put('/gallery/:id', protect, isAdmin, setGalleryPostStatus);
router.delete('/gallery/:id', protect, isAdmin, deleteGalleryPost);

module.exports = router;
