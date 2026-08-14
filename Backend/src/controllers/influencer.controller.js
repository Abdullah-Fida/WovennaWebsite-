const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;

const Influencer = require('../models/influencer.model');
const GalleryPost = require('../models/galleryPost.model');
const Order = require('../models/order.model');
const Promo = require('../models/promo.model');
const User = require('../models/user.model');
const { getSetting } = require('../models/setting.model');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function uploadBuffer(buffer, folder = 'gallery') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        timeout: 120000,
        resource_type: 'image',
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

/**
 * Work out whether someone may apply, and if not, exactly why.
 *
 * Orders placed while signed out are matched on the email address, so buying
 * as a guest and registering later with the same address still counts —
 * otherwise a real customer looks like a stranger to the programme.
 *
 * The bar itself is an admin setting rather than a constant, because
 * 'delivered' depends on someone remembering to move the order along; a shop
 * that hasn't been marking orders Delivered would otherwise have a programme
 * nobody can ever enter.
 */
async function checkEligibility(user) {
  const rule = await getSetting('influencerEligibility');

  const ownership = {
    $or: [
      { user: user._id },
      { guestEmail: new RegExp(`^${escapeRegex(user.email)}$`, 'i') },
    ],
  };

  if (rule === 'open') {
    return { eligible: true, rule, order: null, reason: '' };
  }

  const delivered = await Order.findOne({ ...ownership, orderStatus: 'Delivered' })
    .sort({ createdAt: -1 });

  if (delivered) return { eligible: true, rule, order: delivered, reason: '' };

  // No delivered order. Say what they *do* have, so the page can explain the
  // wait instead of just refusing.
  const latest = await Order.findOne(ownership).sort({ createdAt: -1 });

  if (rule === 'any-order') {
    return latest
      ? { eligible: true, rule, order: latest, reason: '' }
      : {
          eligible: false,
          rule,
          order: null,
          reason: 'no-order',
        };
  }

  return {
    eligible: false,
    rule,
    order: latest,
    reason: latest ? 'awaiting-delivery' : 'no-order',
  };
}

// Derive a readable code from their name, with a numeric suffix on collision.
async function generateCode(seed) {
  const base =
    String(seed || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'WOVEN';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const [takenByInfluencer, takenByPromo] = await Promise.all([
      Influencer.findOne({ code: candidate }),
      Promo.findOne({ code: candidate }),
    ]);
    if (!takenByInfluencer && !takenByPromo) return candidate;
  }
  return `${base}${Date.now().toString().slice(-5)}`;
}

// Earnings are only real once the parcel has landed.
async function earningsFor(influencerId) {
  const rows = await Order.aggregate([
    { $match: { influencer: influencerId } },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        revenue: { $sum: '$finalAmount' },
        commission: { $sum: '$commissionAmount' },
      },
    },
  ]);

  const summary = { orders: 0, revenue: 0, earned: 0, pending: 0, cancelled: 0 };
  rows.forEach((r) => {
    if (r._id === 'Cancelled') {
      summary.cancelled += r.count;
      return;
    }
    summary.orders += r.count;
    summary.revenue += r.revenue;
    if (r._id === 'Delivered') summary.earned += r.commission;
    else summary.pending += r.commission;
  });
  return summary;
}

const publicShape = (inf, stats) => ({
  _id: inf._id,
  name: inf.name,
  handle: inf.handle,
  status: inf.status,
  code: inf.code,
  commissionRate: inf.commissionRate,
  discountPercent: inf.discountPercent,
  instagram: inf.instagram,
  tiktok: inf.tiktok,
  followers: inf.followers,
  payoutMethod: inf.payoutMethod,
  payoutDetails: inf.payoutDetails,
  commissionPaid: inf.commissionPaid,
  adminNote: inf.adminNote,
  createdAt: inf.createdAt,
  stats,
});

// ---------------------------------------------------------------- applicant

// Whether the signed-in user can apply, and their application if they have one.
const getMyInfluencer = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ user: req.user._id });

  if (!influencer) {
    const check = await checkEligibility(req.user);
    return res.json({
      success: true,
      influencer: null,
      eligible: check.eligible,
      rule: check.rule,
      reason: check.reason,
      qualifyingOrder: check.order
        ? {
            orderId: check.order.orderId,
            orderStatus: check.order.orderStatus,
            placedAt: check.order.createdAt,
          }
        : null,
    });
  }

  const stats = await earningsFor(influencer._id);
  res.json({ success: true, influencer: publicShape(influencer, stats), eligible: true });
});

const applyAsInfluencer = asyncHandler(async (req, res) => {
  const existing = await Influencer.findOne({ user: req.user._id });
  if (existing) {
    return res.status(400).json({ message: 'You have already applied to the program' });
  }

  const check = await checkEligibility(req.user);
  if (!check.eligible) {
    return res.status(400).json({
      message:
        check.reason === 'awaiting-delivery'
          ? `Your order ${check.order?.orderId || ''} is still ${check.order?.orderStatus || 'on its way'}. You can apply once it is marked Delivered.`.trim()
          : 'The programme is open to customers who have ordered from us. Place an order and you can apply from here.',
    });
  }
  const qualifying = check.order;

  const { handle, instagram, tiktok, followers, pitch, phone } = req.body;

  const influencer = await Influencer.create({
    user: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: phone || req.user.phone || '',
    handle: String(handle || '').replace(/^@/, '').trim(),
    instagram: String(instagram || '').trim(),
    tiktok: String(tiktok || '').trim(),
    followers: Math.max(0, Number(followers) || 0),
    pitch: String(pitch || '').slice(0, 1000),
    qualifyingOrder: qualifying ? qualifying._id : null,
  });

  res.status(201).json({
    success: true,
    influencer: publicShape(influencer, await earningsFor(influencer._id)),
  });
});

const updateMyPayout = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ user: req.user._id });
  if (!influencer) return res.status(404).json({ message: 'You are not in the program' });

  if (req.body.payoutMethod !== undefined) influencer.payoutMethod = String(req.body.payoutMethod).slice(0, 60);
  if (req.body.payoutDetails !== undefined) influencer.payoutDetails = String(req.body.payoutDetails).slice(0, 200);
  if (req.body.handle !== undefined) influencer.handle = String(req.body.handle).replace(/^@/, '').trim();
  if (req.body.instagram !== undefined) influencer.instagram = String(req.body.instagram).trim();
  if (req.body.tiktok !== undefined) influencer.tiktok = String(req.body.tiktok).trim();

  await influencer.save();
  res.json({ success: true, influencer: publicShape(influencer, await earningsFor(influencer._id)) });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ user: req.user._id });
  if (!influencer) return res.status(404).json({ message: 'You are not in the program' });

  // Deliberately no customer names or addresses — an influencer needs the
  // numbers, not somebody else's personal details.
  const orders = await Order.find({ influencer: influencer._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .select('orderId createdAt orderStatus finalAmount commissionAmount');

  res.json({ success: true, orders });
});

// ------------------------------------------------------------ gallery posts

const getMyPosts = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ user: req.user._id });
  if (!influencer) return res.status(404).json({ message: 'You are not in the program' });

  const posts = await GalleryPost.find({ influencer: influencer._id })
    .sort({ createdAt: -1 })
    .populate('product', 'name');
  res.json({ success: true, posts });
});

const createMyPost = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ user: req.user._id });
  if (!influencer) return res.status(404).json({ message: 'You are not in the program' });
  if (influencer.status !== 'approved') {
    return res.status(403).json({ message: 'Your application is still being reviewed' });
  }
  if (!req.file) return res.status(400).json({ message: 'Please choose an image' });

  const pending = await GalleryPost.countDocuments({
    influencer: influencer._id,
    status: 'pending',
  });
  if (pending >= 5) {
    return res.status(400).json({
      message: 'You already have 5 posts awaiting review. Please wait for those first.',
    });
  }

  const uploaded = await uploadBuffer(req.file.buffer, 'gallery');

  const post = await GalleryPost.create({
    influencer: influencer._id,
    influencerName: influencer.handle || influencer.name,
    image: uploaded.secure_url,
    caption: String(req.body.caption || '').slice(0, 140),
    product: req.body.product || null,
  });

  res.status(201).json({ success: true, post });
});

const deleteMyPost = asyncHandler(async (req, res) => {
  const influencer = await Influencer.findOne({ user: req.user._id });
  if (!influencer) return res.status(404).json({ message: 'You are not in the program' });

  const post = await GalleryPost.findOne({ _id: req.params.id, influencer: influencer._id });
  if (!post) return res.status(404).json({ message: 'Post not found' });

  await post.deleteOne();
  res.json({ success: true, message: 'Post removed' });
});

// ------------------------------------------------------------------- public

// The approved lookbook, for the storefront gallery.
const getPublicGallery = asyncHandler(async (req, res) => {
  const posts = await GalleryPost.find({ status: 'approved' })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(40)
    .select('image caption influencerName product source')
    .populate('product', 'name');

  res.json({ success: true, posts });
});

// Confirm a referral code before checkout so the shopper sees it is real.
const validateReferral = asyncHandler(async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ message: 'No code given' });

  const influencer = await Influencer.findOne({ code, status: 'approved' });
  if (!influencer) return res.status(404).json({ message: 'That code is not active' });

  res.json({
    success: true,
    referral: {
      code: influencer.code,
      name: influencer.handle || influencer.name,
      discountPercent: influencer.discountPercent,
    },
  });
});

module.exports = {
  getMyInfluencer,
  applyAsInfluencer,
  updateMyPayout,
  getMyOrders,
  getMyPosts,
  createMyPost,
  deleteMyPost,
  getPublicGallery,
  validateReferral,
  // shared with the admin controller
  generateCode,
  earningsFor,
  publicShape,
  uploadBuffer,
};
