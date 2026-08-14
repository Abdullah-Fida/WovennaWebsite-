const express = require('express');
const router = express.Router();

const { getPublishedReviews } = require('../controllers/review.controller');

// Public: the homepage testimonial rail.
router.get('/', getPublishedReviews);

module.exports = router;
