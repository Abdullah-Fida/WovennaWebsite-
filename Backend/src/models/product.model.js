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

  // One buyable combination (colour × size). Price and image are optional and
  // fall back to the product's own values, so existing variants that only set
  // stock keep working unchanged.
  variants: [{
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    sku: { type: String, default: '' },
    price: { type: Number, default: null },
    originalPrice: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    image: { type: String, default: '' }
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
  isActive: { type: Boolean, default: true },

  // The order products appear in on the storefront. Set from the admin panel
  // by dragging the list, so merchandising is decided here rather than by a
  // dropdown the shopper has to find. Lower shows first; ties fall back to
  // newest.
  sortOrder: { type: Number, default: 0, index: true },

  // Kept in step by the review controller whenever a published review is
  // added, edited, moved to another product or removed. Denormalised so a
  // product grid can show stars without a second request per card.
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
