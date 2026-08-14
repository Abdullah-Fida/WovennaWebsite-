const mongoose = require('mongoose');

/**
 * A customer testimonial shown on the homepage.
 *
 * Written by the shop rather than collected automatically, so there is no
 * verification flow here — an admin adds, edits, orders and removes them.
 * `sortOrder` drives the running order; ties fall back to newest first.
 */
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },

    rating: { type: Number, min: 1, max: 5, default: 5 },

    title: { type: String, default: '', trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },

    // Optional: ties the review to what they bought.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },

    isPublished: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ isPublished: 1, sortOrder: 1, createdAt: -1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
