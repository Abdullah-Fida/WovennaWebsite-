const asyncHandler = require('express-async-handler');
const Review = require('../models/review.model');

// Public: what the homepage testimonial section renders.
const getPublishedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isPublished: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(24)
    .select('name location rating title body product')
    .populate('product', 'name');

  res.json({ success: true, reviews });
});

// Admin: everything, published or not.
const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .sort({ sortOrder: 1, createdAt: -1 })
    .populate('product', 'name');
  res.json({ success: true, reviews });
});

function readBody(body) {
  const rating = Number(body.rating);
  return {
    name: String(body.name || '').trim(),
    location: String(body.location || '').trim(),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
    title: String(body.title || '').trim().slice(0, 120),
    body: String(body.body || '').trim().slice(0, 1000),
    product: body.product || null,
    isPublished: body.isPublished === false || body.isPublished === 'false' ? false : true,
    sortOrder: Number(body.sortOrder) || 0,
  };
}

const createReview = asyncHandler(async (req, res) => {
  const data = readBody(req.body);
  if (!data.name) return res.status(400).json({ message: 'A name is required' });
  if (!data.body) return res.status(400).json({ message: 'The review text is required' });

  // New reviews go to the top unless a position was given.
  if (!req.body.sortOrder) {
    const first = await Review.findOne().sort({ sortOrder: 1 }).select('sortOrder');
    data.sortOrder = first ? first.sortOrder - 1 : 0;
  }

  const review = await Review.create(data);
  res.status(201).json({ success: true, review });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  const data = readBody({ ...review.toObject(), ...req.body });
  if (!data.name) return res.status(400).json({ message: 'A name is required' });
  if (!data.body) return res.status(400).json({ message: 'The review text is required' });

  Object.assign(review, data);
  await review.save();
  res.json({ success: true, review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});

// Persist a whole drag-reordered list in one write.
const reorderReviews = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ message: 'No order given' });

  await Review.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { sortOrder: index } },
    }))
  );

  res.json({ success: true });
});

module.exports = {
  getPublishedReviews,
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  reorderReviews,
};
