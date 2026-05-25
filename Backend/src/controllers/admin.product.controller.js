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

// Create product (supports multiple images)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  if (!name || !price) {
    res.status(400);
    throw new Error('Name and price are required');
  }

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
    category,
    stock: stock || 0,
    images
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

  const { name, description, price, category, stock } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;

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
