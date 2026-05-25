// controllers/cart.controller.js
const Cart = require('../models/cart.model');

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, name, price, image, quantity = 1 } = req.body;
    const userId = req.user._id;

    // Check if product already in cart
    const existingItem = await Cart.findOne({ 
      user: userId, 
      productId: productId 
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
      return res.status(200).json(existingItem);
    }

    // Add new item to cart
    const cartItem = new Cart({
      user: userId,
      productId,
      name,
      price,
      image,
      quantity
    });

    await cartItem.save();
    res.status(201).json(cartItem);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ 
      message: "Failed to add to cart", 
      error: err.message 
    });
  }
};

// Get cart items
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartItems = await Cart.find({ user: userId });
    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ 
      message: "Failed to fetch cart", 
      error: error.message 
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    const cartItem = await Cart.findOne({ 
      user: userId, 
      productId: productId 
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    
    res.status(200).json(cartItem);
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ 
      message: "Failed to update cart", 
      error: error.message 
    });
  }
};

// Delete cart item
const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const result = await Cart.findOneAndDelete({ 
      user: userId, 
      productId: productId 
    });

    if (!result) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.status(200).json({ 
      message: "Item removed from cart", 
      productId: productId 
    });
  } catch (error) {
    console.error("Delete cart error:", error);
    res.status(500).json({ 
      message: "Failed to delete item", 
      error: error.message 
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.deleteMany({ user: userId });
    
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ 
      message: "Failed to clear cart", 
      error: error.message 
    });
  }
};

module.exports = { 
  addToCart, 
  getCart, 
  updateCartItem, 
  deleteCartItem, 
  clearCart 
};