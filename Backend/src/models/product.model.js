const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, default: 'General' },
  stock: { type: Number, default: 0 },
  images: [{ type: String }],

  // New fields for enhanced admin panel
  colors: [{
    name: { type: String, required: true },
    hex: { type: String, required: true }
  }],
  sizes: [{ type: String }],

  // Per-variant stock (color + size combination)
  variants: [{
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    stock: { type: Number, default: 0 }
  }],

  material: { type: String, default: '' },
  weight: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  widthCm: { type: String, default: '' },
  heightCm: { type: String, default: '' },
  careInstructions: { type: String, default: 'Wipe with dry cloth. Keep away from water.' },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  showInSoldOutRow: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
