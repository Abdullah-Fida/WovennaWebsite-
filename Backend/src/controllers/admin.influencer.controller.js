const asyncHandler = require('express-async-handler');

const Influencer = require('../models/influencer.model');
const GalleryPost = require('../models/galleryPost.model');
const Order = require('../models/order.model');
const Promo = require('../models/promo.model');
const { generateCode, earningsFor } = require('./influencer.controller');

// Approved influencer codes never expire on their own; an admin suspends them
// instead. Ten years is effectively "until revoked".
const FAR_FUTURE = () => new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

const listInfluencers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const influencers = await Influencer.find(filter).sort({ createdAt: -1 }).lean();

  // One aggregation for everyone rather than a query per row.
  const ids = influencers.map((i) => i._id);
  const rows = await Order.aggregate([
    { $match: { influencer: { $in: ids } } },
    {
      $group: {
        _id: { influencer: '$influencer', status: '$orderStatus' },
        count: { $sum: 1 },
        revenue: { $sum: '$finalAmount' },
        commission: { $sum: '$commissionAmount' },
      },
    },
  ]);

  const byInfluencer = new Map();
  rows.forEach((r) => {
    const key = String(r._id.influencer);
    const s = byInfluencer.get(key) || { orders: 0, revenue: 0, earned: 0, pending: 0 };
    if (r._id.status !== 'Cancelled') {
      s.orders += r.count;
      s.revenue += r.revenue;
      if (r._id.status === 'Delivered') s.earned += r.commission;
      else s.pending += r.commission;
    }
    byInfluencer.set(key, s);
  });

  res.json({
    success: true,
    influencers: influencers.map((i) => ({
      ...i,
      stats: byInfluencer.get(String(i._id)) || { orders: 0, revenue: 0, earned: 0, pending: 0 },
    })),
  });
});

/**
 * Approve an application.
 *
 * Approval is what mints the code, and the same code is written into the Promo
 * collection so checkout's existing discount path picks it up with no special
 * casing. Rejecting or suspending deactivates that promo again.
 */
const setInfluencerStatus = asyncHandler(async (req, res) => {
  const { status, code, commissionRate, discountPercent, adminNote } = req.body;

  if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const influencer = await Influencer.findById(req.params.id);
  if (!influencer) return res.status(404).json({ message: 'Influencer not found' });

  if (commissionRate !== undefined) {
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ message: 'Commission rate must be between 0 and 100' });
    }
    influencer.commissionRate = rate;
  }

  if (discountPercent !== undefined) {
    const pct = Number(discountPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 90) {
      return res.status(400).json({ message: 'Discount must be between 0 and 90' });
    }
    influencer.discountPercent = pct;
  }

  if (adminNote !== undefined) influencer.adminNote = String(adminNote).slice(0, 500);

  if (status === 'approved') {
    if (!influencer.code) {
      const requested = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (requested) {
        const clash = await Promo.findOne({ code: requested });
        const clashInf = await Influencer.findOne({ code: requested });
        if (clash || clashInf) {
          return res.status(400).json({ message: `The code ${requested} is already taken` });
        }
        influencer.code = requested;
      } else {
        influencer.code = await generateCode(influencer.handle || influencer.name);
      }
    }

    await Promo.findOneAndUpdate(
      { code: influencer.code },
      {
        code: influencer.code,
        discountType: 'percentage',
        discountValue: influencer.discountPercent,
        expirationDate: FAR_FUTURE(),
        minOrderAmount: 0,
        usageLimit: null,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!influencer.approvedAt) influencer.approvedAt = new Date();
  } else if (influencer.code) {
    // Pull the code out of circulation without deleting the history.
    await Promo.findOneAndUpdate({ code: influencer.code }, { isActive: false });
  }

  influencer.status = status;
  await influencer.save();

  res.json({
    success: true,
    influencer: { ...influencer.toObject(), stats: await earningsFor(influencer._id) },
  });
});

// Record a payout. Kept as a running total so partial payments are possible.
const recordPayout = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Enter a payout amount greater than zero' });
  }

  const influencer = await Influencer.findById(req.params.id);
  if (!influencer) return res.status(404).json({ message: 'Influencer not found' });

  const stats = await earningsFor(influencer._id);
  const outstanding = stats.earned - influencer.commissionPaid;
  if (amount > outstanding) {
    return res.status(400).json({
      message: `Only Rs. ${Math.max(0, outstanding).toLocaleString()} is owed on delivered orders`,
    });
  }

  influencer.commissionPaid += amount;
  await influencer.save();

  res.json({
    success: true,
    influencer: { ...influencer.toObject(), stats: await earningsFor(influencer._id) },
  });
});

// ------------------------------------------------------------ gallery review

const listGalleryPosts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const posts = await GalleryPost.find(filter)
    .sort({ status: 1, createdAt: -1 })
    .populate('influencer', 'name handle code status')
    .populate('product', 'name');

  res.json({ success: true, posts });
});

const setGalleryPostStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason, sortOrder, caption } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const post = await GalleryPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  post.status = status;
  if (rejectionReason !== undefined) post.rejectionReason = String(rejectionReason).slice(0, 300);
  if (sortOrder !== undefined) post.sortOrder = Number(sortOrder) || 0;
  if (caption !== undefined) post.caption = String(caption).slice(0, 140);

  await post.save();
  res.json({ success: true, post });
});

const deleteGalleryPost = asyncHandler(async (req, res) => {
  const post = await GalleryPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

module.exports = {
  listInfluencers,
  setInfluencerStatus,
  recordPayout,
  listGalleryPosts,
  setGalleryPostStatus,
  deleteGalleryPost,
};
