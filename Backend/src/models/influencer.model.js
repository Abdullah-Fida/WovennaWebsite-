const mongoose = require('mongoose');

/**
 * A customer who has been accepted into the Wovenaa Influencer Program.
 *
 * Entry is earned, not given: an applicant must already have an order marked
 * Delivered. That check lives in the controller, and the order that qualified
 * them is recorded here so an admin can see why they were eligible.
 */
const influencerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Snapshotted so the admin table stays readable without a populate.
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },

    handle: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    tiktok: { type: String, default: '', trim: true },
    followers: { type: Number, default: 0 },
    pitch: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },

    // Doubles as the customer-facing promo code and the referral parameter.
    // Only set once approved, because approval is what creates the promo.
    code: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
      // A sparse unique index lets many pending applicants hold a null code.
      index: { unique: true, sparse: true },
    },

    // Percent of the order subtotal the influencer earns.
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    // Percent off that their code gives the shopper.
    discountPercent: { type: Number, default: 10, min: 0, max: 90 },

    qualifyingOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },

    payoutMethod: { type: String, default: '' },
    payoutDetails: { type: String, default: '' },

    // Running totals kept for payouts. Earnings are only counted once an
    // order reaches Delivered, so this is recomputed rather than incremented.
    commissionPaid: { type: Number, default: 0 },

    adminNote: { type: String, default: '' },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);
