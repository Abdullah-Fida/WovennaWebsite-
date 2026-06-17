const asyncHandler = require('express-async-handler');
const Promo = require('../models/promo.model');

// Create a promo code
const createPromo = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    expirationDate,
    minOrderAmount,
    usageLimit,
    isActive,
    applicableProducts
  } = req.body;

  if (!code || !discountType || discountValue === undefined || !expirationDate) {
    res.status(400);
    throw new Error('Please provide code, discountType, discountValue, and expirationDate');
  }

  const promoExists = await Promo.findOne({ code: code.toUpperCase() });
  if (promoExists) {
    res.status(400);
    throw new Error('Promo code already exists');
  }

  const promo = await Promo.create({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    expirationDate,
    minOrderAmount: minOrderAmount || 0,
    usageLimit: usageLimit || null,
    isActive: isActive !== undefined ? isActive : true,
    applicableProducts: applicableProducts || []
  });

  res.status(201).json(promo);
});

// Get all promos
const getPromos = asyncHandler(async (req, res) => {
  const promos = await Promo.find().sort({ createdAt: -1 });
  res.json(promos);
});

// Get single promo
const getPromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findById(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Promo not found');
  }
  res.json(promo);
});

// Update a promo code
const updatePromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findById(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Promo not found');
  }

  const {
    code,
    discountType,
    discountValue,
    expirationDate,
    minOrderAmount,
    usageLimit,
    isActive,
    applicableProducts
  } = req.body;

  if (code) promo.code = code.toUpperCase();
  if (discountType) promo.discountType = discountType;
  if (discountValue !== undefined) promo.discountValue = discountValue;
  if (expirationDate) promo.expirationDate = expirationDate;
  if (minOrderAmount !== undefined) promo.minOrderAmount = minOrderAmount;
  if (usageLimit !== undefined) promo.usageLimit = usageLimit;
  if (isActive !== undefined) promo.isActive = isActive;
  if (applicableProducts) promo.applicableProducts = applicableProducts;

  const updatedPromo = await promo.save();
  res.json(updatedPromo);
});

// Delete a promo code
const deletePromo = asyncHandler(async (req, res) => {
  const promo = await Promo.findById(req.params.id);
  if (!promo) {
    res.status(404);
    throw new Error('Promo not found');
  }

  await Promo.deleteOne({ _id: req.params.id });
  res.json({ message: 'Promo removed' });
});

module.exports = {
  createPromo,
  getPromos,
  getPromo,
  updatePromo,
  deletePromo
};
