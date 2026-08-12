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
    const stream = cloudinary.uploader.upload_stream(
      { folder, timeout: 120000 },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Helper: upload images SEQUENTIALLY to avoid memory/timeout issues with many files
async function uploadImagesSequentially(files, folder = 'products') {
  const urls = [];
  for (const file of files) {
    try {
      const result = await uploadBufferToCloudinary(file.buffer, folder);
      urls.push(result.secure_url);
    } catch (err) {
      console.error(`Failed to upload image ${file.originalname}:`, err.message);
      throw new Error(`Failed to upload image "${file.originalname}". Please try with smaller or fewer images.`);
    }
  }
  return urls;
}

// Derive the Cloudinary public_id from a delivery URL so removed images can be
// cleaned up. Returns null for URLs we didn't upload (e.g. local placeholders).
function publicIdFromUrl(url) {
  const match = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/.exec(url || '');
  return match ? match[1] : null;
}

async function destroyCloudinaryImage(url) {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Losing an orphaned file is not worth failing the whole save over.
    console.error('Failed to delete image from Cloudinary:', err.message);
  }
}

function resolveVariantImage(v, images, allowed) {
  if (v.image && allowed.has(v.image)) return v.image;
  const idx = Number(v.imageIndex);
  if (Number.isInteger(idx) && idx >= 0 && idx < images.length) return images[idx];
  return '';
}

// Clean incoming variants: coerce numbers, drop blank rows, and make sure a
// variant's image actually belongs to the product (an admin picks it from the
// uploaded gallery, so a stale or foreign URL is discarded rather than stored).
function normalizeVariants(raw, images = []) {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(images);
  const seen = new Set();
  const out = [];

  for (const v of raw) {
    if (!v || typeof v !== 'object') continue;

    const color = String(v.color || '').trim();
    const size = String(v.size || '').trim();
    if (!color && !size) continue; // a variant must be identifiable

    const key = `${color}::${size}`;
    if (seen.has(key)) continue; // last duplicate wins would surprise; keep first
    seen.add(key);

    const price = Number(v.price);
    const originalPrice = Number(v.originalPrice);

    out.push({
      color,
      size,
      sku: String(v.sku || '').trim(),
      price: Number.isFinite(price) && price > 0 ? price : null,
      originalPrice: Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : null,
      stock: Math.max(0, Number(v.stock) || 0),
      // On create the gallery URLs don't exist yet, so the UI sends a position
      // instead; on edit it sends the URL itself.
      image: resolveVariantImage(v, images, allowed)
    });
  }
  return out;
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
  try {
    const { name, description, price, originalPrice, category, stock, material, weight, dimensions, widthCm, heightCm, careInstructions, isFeatured, showInSoldOutRow, isActive } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400);
      throw new Error('Product name is required');
    }
    if (price === undefined || price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      res.status(400);
      throw new Error('Price is required and must be a valid number');
    }

    // Parse JSON array fields from FormData
    const colors = safeParseJSON(req.body.colors, []);
    const sizes = safeParseJSON(req.body.sizes, []);
    const tags = safeParseJSON(req.body.tags, []);
    const variants = safeParseJSON(req.body.variants, []);

    // Upload images sequentially to avoid timeout/memory issues
    let images = [];
    if (req.files && req.files.length) {
      images = await uploadImagesSequentially(req.files);
    }

    const cleanVariants = normalizeVariants(variants, images);
    // With variants, the headline stock is their sum rather than a separate
    // number an admin has to keep in step by hand.
    const totalStock = cleanVariants.length
      ? cleanVariants.reduce((sum, v) => sum + v.stock, 0)
      : Number(stock) || 0;

    const featuredFlag = isFeatured === 'true' || isFeatured === true;
    const soldOutFlag = showInSoldOutRow === 'true' || showInSoldOutRow === true;

    if (featuredFlag) {
      const count = await Product.countDocuments({ isFeatured: true });
      if (count >= 3) { res.status(400); throw new Error('You can only feature up to 3 products on the top row. Please unfeature another product first.'); }
    }

    if (soldOutFlag) {
      const count = await Product.countDocuments({ showInSoldOutRow: true });
      if (count >= 3) { res.status(400); throw new Error('You can only feature up to 3 sold-out products. Please unfeature another product first.'); }
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: description || '',
      price: Number(price),
      // An empty "original price" field must stay unset, not become NaN.
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: category || 'General',
      stock: totalStock,
      images,
      colors,
      sizes,
      variants: cleanVariants,
      material: material || '',
      weight: weight || '',
      dimensions: dimensions || '',
      widthCm: widthCm || '',
      heightCm: heightCm || '',
      careInstructions: careInstructions || 'Wipe with dry cloth. Keep away from water.',
      tags,
      isFeatured: featuredFlag,
      showInSoldOutRow: soldOutFlag,
      isActive: isActive === 'false' ? false : true
    });

    res.status(201).json(product);
  } catch (err) {
    // If status isn't set yet, set 500
    if (!res.headersSent) {
      const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
      res.status(statusCode);
    }
    throw err;
  }
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
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const { name, description, price, originalPrice, category, stock, material, weight, dimensions, widthCm, heightCm, careInstructions, isFeatured, showInSoldOutRow, isActive } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) { res.status(400); throw new Error('Product name cannot be empty'); }
      product.name = String(name).trim();
    }
    if (description !== undefined) product.description = description;
    if (price !== undefined) {
      if (price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
        res.status(400);
        throw new Error('Price must be a valid number');
      }
      product.price = Number(price);
    }
    // Clearing the field removes the crossed-out compare-at price.
    if (originalPrice !== undefined) {
      product.originalPrice = originalPrice ? Number(originalPrice) : undefined;
    }
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = Number(stock) || 0;

    // New fields
    if (material !== undefined) product.material = material;
    if (weight !== undefined) product.weight = weight;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (widthCm !== undefined) product.widthCm = widthCm;
    if (heightCm !== undefined) product.heightCm = heightCm;
    if (careInstructions !== undefined) product.careInstructions = careInstructions;
    
    if (isFeatured !== undefined) {
      const featuredFlag = isFeatured === 'true' || isFeatured === true;
      if (featuredFlag && !product.isFeatured) {
        const count = await Product.countDocuments({ isFeatured: true });
        if (count >= 3) { res.status(400); throw new Error('You can only feature up to 3 products on the top row. Please unfeature another product first.'); }
      }
      product.isFeatured = featuredFlag;
    }

    if (showInSoldOutRow !== undefined) {
      const soldOutFlag = showInSoldOutRow === 'true' || showInSoldOutRow === true;
      if (soldOutFlag && !product.showInSoldOutRow) {
        const count = await Product.countDocuments({ showInSoldOutRow: true });
        if (count >= 3) { res.status(400); throw new Error('You can only feature up to 3 sold-out products. Please unfeature another product first.'); }
      }
      product.showInSoldOutRow = soldOutFlag;
    }

    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    // Parse JSON array fields
    if (req.body.colors !== undefined) product.colors = safeParseJSON(req.body.colors, []);
    if (req.body.sizes !== undefined) product.sizes = safeParseJSON(req.body.sizes, []);
    if (req.body.tags !== undefined) product.tags = safeParseJSON(req.body.tags, []);

    // Image management.
    //
    // `existingImages` is the ordered list of already-uploaded URLs the admin
    // chose to KEEP — dropping a URL from it deletes that image, and the first
    // entry is the cover. Newly uploaded files are appended.
    //
    // When the field is absent entirely (older clients), keep what's there.
    let images = product.images;
    if (req.body.existingImages !== undefined) {
      const keep = safeParseJSON(req.body.existingImages, []);
      const current = new Set(product.images);
      images = keep.filter((url) => current.has(url));

      const removed = product.images.filter((url) => !images.includes(url));
      await Promise.all(removed.map((url) => destroyCloudinaryImage(url)));
    }

    if (req.files && req.files.length) {
      const newImages = await uploadImagesSequentially(req.files);
      images = images.concat(newImages);
    }
    product.images = images;

    // Normalised last: a variant's photo has to be checked against the final
    // gallery, and deleting an image must clear it from any variant using it.
    if (req.body.variants !== undefined) {
      product.variants = normalizeVariants(safeParseJSON(req.body.variants, []), images);
    } else if (product.variants?.length) {
      const kept = new Set(images);
      product.variants.forEach((v) => {
        if (v.image && !kept.has(v.image)) v.image = '';
      });
    }

    // Keep the headline stock in step with the variant breakdown.
    if (product.variants?.length) {
      product.stock = product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    if (!res.headersSent) {
      const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
      res.status(statusCode);
    }
    throw err;
  }
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
