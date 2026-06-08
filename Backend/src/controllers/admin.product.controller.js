const asyncHandler = require('express-async-handler');
const Product = require('../models/product.model');
const cloudinary = require('cloudinary').v2;

// configure cloudinary via env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// helper: upload a buffer to Cloudinary and return the result
function uploadBufferToCloudinary(buffer, folder = 'products') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// Helper: safely parse JSON string fields from FormData
function safeParseJSON(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Create product (supports multiple images)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, category, stock, material, weight, isFeatured, isActive } = req.body;
  if (!name || !price) {
    res.status(400);
    throw new Error('Name and price are required');
  }

  // Parse JSON array fields from FormData
  const colors = safeParseJSON(req.body.colors, []);
  const sizes = safeParseJSON(req.body.sizes, []);
  const tags = safeParseJSON(req.body.tags, []);

  // if files were uploaded, upload to Cloudinary
  let images = [];
  if (req.files && req.files.length) {
    const uploads = req.files.map((f) => uploadBufferToCloudinary(f.buffer));
    const results = await Promise.all(uploads);
    images = results.map(r => r.secure_url);
  }

  const product = await Product.create({
    name,
    description,
    price,
    originalPrice,
    category,
    stock: stock || 0,
    images,
    colors,
    sizes,
    material: material || '',
    weight: weight || '',
    tags,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isActive: isActive === 'false' ? false : true
  });

  res.status(201).json(product);
});

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const { name, description, price, originalPrice, category, stock, material, weight, isFeatured, isActive } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (originalPrice !== undefined) product.originalPrice = originalPrice;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;

  // New fields
  if (material !== undefined) product.material = material;
  if (weight !== undefined) product.weight = weight;
  if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

  // Parse JSON array fields
  if (req.body.colors !== undefined) product.colors = safeParseJSON(req.body.colors, []);
  if (req.body.sizes !== undefined) product.sizes = safeParseJSON(req.body.sizes, []);
  if (req.body.tags !== undefined) product.tags = safeParseJSON(req.body.tags, []);

  // append new images if any - upload to Cloudinary
  if (req.files && req.files.length) {
    const uploads = req.files.map((f) => uploadBufferToCloudinary(f.buffer));
    const results = await Promise.all(uploads);
    const images = results.map(r => r.secure_url);
    product.images = product.images.concat(images);
  }

  const updated = await product.save();
  res.json(updated);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { 
    res.status(404); 
    throw new Error('Product not found'); 
  }
  
  // Use deleteOne() instead of remove()
  await Product.deleteOne({ _id: req.params.id });
  
  res.json({ message: 'Product deleted' });
});

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
