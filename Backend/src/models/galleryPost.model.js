const mongoose = require('mongoose');

/**
 * A single social image submitted by an influencer for the site lookbook.
 *
 * Nothing reaches the storefront unreviewed — posts land as `pending` and an
 * admin approves them. An approved post can link to a product so the image
 * doubles as a shoppable entry point.
 */
const galleryPostSchema = new mongoose.Schema(
  {
    // Where the image came from. House images are uploaded by an admin and go
    // live immediately; influencer submissions wait for review.
    source: {
      type: String,
      enum: ['house', 'influencer'],
      default: 'influencer',
      index: true,
    },

    // Null for house images, which have no contributor.
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer',
      default: null,
      index: true,
    },
    // Denormalised so the public gallery needs no populate to credit them.
    influencerName: { type: String, default: '' },

    image: { type: String, required: true },
    caption: { type: String, default: '', trim: true, maxlength: 140 },

    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },

    // How many times a shopper opened this image's product link.
    clicks: { type: Number, default: 0 },
    // Manual ordering for the storefront gallery; lower shows first.
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GalleryPost || mongoose.model('GalleryPost', galleryPostSchema);
