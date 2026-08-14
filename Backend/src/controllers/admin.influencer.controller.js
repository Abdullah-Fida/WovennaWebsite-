const asyncHandler = require('express-async-handler');

const Influencer = require('../models/influencer.model');
const GalleryPost = require('../models/galleryPost.model');
const Order = require('../models/order.model');
const Promo = require('../models/promo.model');
const Product = require('../models/product.model');
const { generateCode, earningsFor, uploadBuffer } = require('./influencer.controller');
const { getSetting, setSetting } = require('../models/setting.model');

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
  if (req.query.source && req.query.source !== 'all') filter.source = req.query.source;

  const posts = await GalleryPost.find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .populate('influencer', 'name handle code status')
    .populate('product', 'name');

  res.json({ success: true, posts });
});

// Admin adds an image to the lookbook directly. House images skip review —
// an admin approving their own upload would be pointless.
const createGalleryPost = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please choose an image' });

  const uploaded = await uploadBuffer(req.file.buffer, 'gallery');

  const last = await GalleryPost.findOne().sort({ sortOrder: -1 }).select('sortOrder');

  const post = await GalleryPost.create({
    source: 'house',
    influencer: null,
    influencerName: '',
    image: uploaded.secure_url,
    caption: String(req.body.caption || '').slice(0, 140),
    product: req.body.product || null,
    status: 'approved',
    sortOrder: last ? last.sortOrder + 1 : 0,
  });

  res.status(201).json({ success: true, post });
});

/**
 * Fill the lookbook from the catalogue.
 *
 * The gallery is meant to show our own products, and every product photo
 * deserves to be in there. Re-uploading each one by hand would be tedious and
 * would duplicate images already on Cloudinary, so this points at the existing
 * URLs instead. Images already in the lookbook are skipped, which makes the
 * button safe to press again after adding a product.
 */
const importProductImages = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: { $ne: false } })
    .sort({ sortOrder: 1, createdAt: -1 })
    .select('name images');

  const existing = new Set((await GalleryPost.find().select('image')).map((p) => p.image));
  const last = await GalleryPost.findOne().sort({ sortOrder: -1 }).select('sortOrder');
  let order = last ? last.sortOrder + 1 : 0;

  // One photo per product — its cover shot. Pulling in every image turned the
  // lookbook into a thirty-tile contact sheet; the point is that each product
  // appears once, and anything beyond that is a deliberate choice made here.
  const additions = [];
  for (const product of products) {
    const cover = (product.images || [])[0];
    if (!cover || existing.has(cover)) continue;
    existing.add(cover);
    additions.push({
      source: 'house',
      influencer: null,
      influencerName: '',
      image: cover,
      caption: product.name,
      product: product._id,
      status: 'approved',
      sortOrder: order++,
    });
  }

  if (additions.length) await GalleryPost.insertMany(additions);

  res.json({
    success: true,
    added: additions.length,
    message: additions.length
      ? `Added ${additions.length} product${additions.length === 1 ? '' : 's'} to the lookbook`
      : 'Every product is already in the lookbook',
  });
});

const setGalleryPostStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason, sortOrder, caption, product } = req.body;

  const post = await GalleryPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (status !== undefined) {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    post.status = status;
  }

  if (rejectionReason !== undefined) post.rejectionReason = String(rejectionReason).slice(0, 300);
  if (sortOrder !== undefined) post.sortOrder = Number(sortOrder) || 0;
  if (caption !== undefined) post.caption = String(caption).slice(0, 140);
  if (product !== undefined) post.product = product || null;

  await post.save();
  res.json({ success: true, post });
});

const reorderGalleryPosts = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ message: 'No order given' });

  await GalleryPost.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { sortOrder: index } },
    }))
  );

  res.json({ success: true });
});

const deleteGalleryPost = asyncHandler(async (req, res) => {
  const post = await GalleryPost.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

// ---------------------------------------------------------------- settings

const getProgramSettings = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    settings: { influencerEligibility: await getSetting('influencerEligibility') },
  });
});

const updateProgramSettings = asyncHandler(async (req, res) => {
  const { influencerEligibility } = req.body;
  if (!['delivered', 'any-order', 'open'].includes(influencerEligibility)) {
    return res.status(400).json({ message: 'Unknown eligibility rule' });
  }
  await setSetting('influencerEligibility', influencerEligibility);
  res.json({ success: true, settings: { influencerEligibility } });
});

module.exports = {
  listInfluencers,
  setInfluencerStatus,
  recordPayout,
  listGalleryPosts,
  createGalleryPost,
  importProductImages,
  setGalleryPostStatus,
  reorderGalleryPosts,
  deleteGalleryPost,
  getProgramSettings,
  updateProgramSettings,
};
