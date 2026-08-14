const asyncHandler = require('express-async-handler');
const Review = require('../models/review.model');
const Product = require('../models/product.model');

/**
 * Recompute a product's headline rating from its published reviews.
 *
 * The average and count live on the product so a grid of cards can show stars
 * without a request per card. Called after anything that could change which
 * reviews belong to a product — including moving one from product A to B,
 * which is why callers pass both ids.
 */
async function recalcProductRating(productId) {
  if (!productId) return;

  const [row] = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(String(productId)), isPublished: true } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingCount: row ? row.count : 0,
    // One decimal is all the UI shows; storing more invites 4.6999999 in JSON.
    ratingAverage: row ? Math.round(row.average * 10) / 10 : 0,
  });
}

const summarise = (reviews) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    total += r.rating;
  });
  return {
    count: reviews.length,
    average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0,
    distribution,
  };
};

// Public. `?product=<id>` narrows to one product's reviews; without it you get
// the general testimonials the homepage shows.
const getPublishedReviews = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.product) filter.product = req.query.product;

  const reviews = await Review.find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(Number(req.query.limit) || 60)
    .select('name location rating title body product createdAt')
    .populate('product', 'name');

  res.json({ success: true, reviews, summary: summarise(reviews) });
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
  await recalcProductRating(review.product);
  res.status(201).json({ success: true, review });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  const previousProduct = review.product ? String(review.product) : null;

  const data = readBody({ ...review.toObject(), ...req.body });
  if (!data.name) return res.status(400).json({ message: 'A name is required' });
  if (!data.body) return res.status(400).json({ message: 'The review text is required' });

  Object.assign(review, data);
  await review.save();

  // Both ends need recomputing when a review is moved between products.
  const nextProduct = review.product ? String(review.product) : null;
  await recalcProductRating(nextProduct);
  if (previousProduct && previousProduct !== nextProduct) {
    await recalcProductRating(previousProduct);
  }

  res.json({ success: true, review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  const productId = review.product;
  await review.deleteOne();
  await recalcProductRating(productId);

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

// One-off repair: rebuild every product's rating from the reviews on record.
const resyncRatings = asyncHandler(async (req, res) => {
  const products = await Product.find().select('_id');
  for (const p of products) await recalcProductRating(p._id);
  res.json({ success: true, message: `Recalculated ${products.length} products` });
});

module.exports = {
  getPublishedReviews,
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  reorderReviews,
  resyncRatings,
  recalcProductRating,
};
