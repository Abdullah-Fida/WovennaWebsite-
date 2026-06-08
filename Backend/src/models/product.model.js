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
  material: { type: String, default: '' },
  weight: { type: String, default: '' },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
