const express = require('express');
const multer = require('multer');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const {
  getMyInfluencer,
  applyAsInfluencer,
  updateMyPayout,
  getMyOrders,
  getMyPosts,
  createMyPost,
  deleteMyPost,
  getPublicGallery,
  validateReferral,
} = require('../controllers/influencer.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'), false),
});

// Turns multer's own errors into the same JSON shape as everything else.
const singleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image too large. Maximum size is 10MB.' });
    }
    if (err) return res.status(400).json({ message: err.message || 'Upload failed' });
    next();
  });
};

// public
router.get('/gallery', getPublicGallery);
router.get('/referral/:code', validateReferral);

// applicant / member
router.get('/me', protect, getMyInfluencer);
router.post('/apply', protect, applyAsInfluencer);
router.put('/me', protect, updateMyPayout);
router.get('/me/orders', protect, getMyOrders);
router.get('/me/posts', protect, getMyPosts);
router.post('/me/posts', protect, singleImage, createMyPost);
router.delete('/me/posts/:id', protect, deleteMyPost);

module.exports = router;
