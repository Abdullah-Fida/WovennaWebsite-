// controllers/cart.controller.js
const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

function findVariant(product, color, size) {
  if (!product.variants || product.variants.length === 0) return null;
  return product.variants.find(
    (v) => (v.color || '') === (color || '') && (v.size || '') === (size || '')
  ) || null;
}

// Stock for the chosen variant, falling back to the product total when the
// product has no per-variant breakdown.
function availableStock(product, color, size) {
  const match = findVariant(product, color, size);
  if (match) return match.stock;
  return product.stock;
}

// A variant may set its own price/photo; anything unset falls back to the
// product. Resolved server-side so the browser can never dictate either.
function resolvePricing(product, variant) {
  const price =
    variant && Number(variant.price) > 0 ? Number(variant.price) : Number(product.price);
  const image =
    (variant && variant.image) ||
    (product.images && product.images.length ? product.images[0] : '');
  return { price, image };
}

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, color = '', size = '' } = req.body;
    const userId = req.user._id;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'A valid product is required' });
    }

    const qty = Math.max(1, Number(quantity) || 1);

    // Trust the database for name/price/image rather than the client, so a
    // stale or tampered payload can never create a mispriced order.
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.isActive === false) {
      return res.status(400).json({ message: 'This product is no longer available' });
    }

    const variant = findVariant(product, color, size);

    // Guard against a stale page posting a combination that no longer exists.
    if (product.variants?.length > 0 && !variant) {
      return res.status(400).json({
        message: `Please choose an available option for ${product.name}`
      });
    }

    const stock = availableStock(product, color, size);
    if (stock <= 0) {
      return res.status(400).json({ message: `${product.name} is sold out` });
    }

    const { price, image } = resolvePricing(product, variant);

    const existingItem = await Cart.findOne({
      user: userId,
      productId,
      color: color || '',
      size: size || ''
    });

    const currentQty = existingItem ? existingItem.quantity : 0;
    const desiredQty = currentQty + qty;

    if (desiredQty > stock) {
      return res.status(400).json({
        message: `Only ${stock} left in stock for ${product.name}`
      });
    }

    if (existingItem) {
      existingItem.quantity = desiredQty;
      // Re-sync in case the admin changed the price or photo since this line
      // was added.
      existingItem.price = price;
      existingItem.image = image;
      await existingItem.save();
      return res.status(200).json(existingItem);
    }

    const cartItem = await Cart.create({
      user: userId,
      productId,
      name: product.name,
      price,
      image,
      color: color || '',
      size: size || '',
      quantity: qty
    });

    res.status(201).json(cartItem);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ message: 'Failed to add to cart', error: err.message });
  }
};

// Get cart items
const getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.status(200).json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
};

// Find a cart line by its own id, falling back to productId for older clients.
async function findCartLine(userId, key) {
  if (mongoose.Types.ObjectId.isValid(key)) {
    const byId = await Cart.findOne({ _id: key, user: userId });
    if (byId) return byId;
    return Cart.findOne({ user: userId, productId: key });
  }
  return null;
}

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const quantity = Number(req.body.quantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cartItem = await findCartLine(userId, req.params.productId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(cartItem.productId);
    if (product) {
      const stock = availableStock(product, cartItem.color, cartItem.size);
      if (quantity > stock) {
        return res.status(400).json({ message: `Only ${stock} left in stock` });
      }
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json(cartItem);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
};

// Delete cart item
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItem = await findCartLine(userId, req.params.productId);

    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await Cart.deleteOne({ _id: cartItem._id });

    res.status(200).json({ message: 'Item removed from cart', _id: cartItem._id });
  } catch (error) {
    console.error('Delete cart error:', error);
    res.status(500).json({ message: 'Failed to delete item', error: error.message });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ user: req.user._id });
    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  deleteCartItem,
  clearCart
};
