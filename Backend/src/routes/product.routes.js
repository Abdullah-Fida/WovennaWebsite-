const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/product.model');

const router = express.Router();

// GET /api/products - public
router.get('/', asyncHandler(async (req, res) => {
  const { category, q } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: 'i' };

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
}));

// GET /api/products/:id - public
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json(product);
}));

module.exports = router;
