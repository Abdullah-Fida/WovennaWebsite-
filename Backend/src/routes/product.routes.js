const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/product.model');

const router = express.Router();

// GET /api/products - public
router.get('/', asyncHandler(async (req, res) => {
  const { category, q, isFeatured, showInSoldOutRow, limit } = req.query;

  // Products deactivated in the admin panel must never reach the storefront.
  const filter = { isActive: { $ne: false } };
  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: 'i' };


  if (isFeatured === 'true') {
    filter.isFeatured = true;
    filter.stock = { $gt: 0 };
  }
  
  // Only surface homepage rows for products that have at least one photo,
  // so the layout never renders empty image frames.
  if (showInSoldOutRow === 'true') {
    filter.showInSoldOutRow = true;
    filter['images.0'] = { $exists: true };
  }

  const query = Product.find(filter).sort({ createdAt: -1 });
  
  if (limit) {
    query.limit(parseInt(limit));
  }

  const products = await query;
  res.json(products);
}));

// GET /api/products/:id - public
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json(product);
}));

module.exports = router;
