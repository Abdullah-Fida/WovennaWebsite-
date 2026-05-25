const asyncHandler = require("express-async-handler");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");

// Generate unique order ID
const generateOrderId = () => {
  return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// CREATE ORDER
// controllers/order.controller.js - Update createOrder function
const createOrder = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const userId = req.user._id;
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({ message: "Shipping address missing" });
  }

  // Normalize common frontend field names to match the schema
  const normalizedShippingAddress = {
    street: shippingAddress.street || shippingAddress.address || "",
    city: shippingAddress.city || "",
    country: shippingAddress.country || "India",
    zipCode: shippingAddress.zipCode || shippingAddress.postalCode || "",
    phone: shippingAddress.phone || "",
  };

  if (!normalizedShippingAddress.street || !normalizedShippingAddress.zipCode) {
    return res.status(400).json({
      message: "Shipping address is incomplete (street and zipCode are required)",
    });
  }

  const cartItems = await Cart.find({ user: userId });

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  let subtotal = 0;

  // build items array that matches Order schema
  const items = cartItems.map(item => {
    if (!item.price || !item.quantity) {
      throw new Error("Invalid cart item data");
    }
    subtotal += item.price * item.quantity;
    return {
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    };
  });

  const shippingCharges = subtotal > 500 ? 0 : 50;
  const taxAmount = Math.round(subtotal * 0.18);
  const finalAmount = subtotal + shippingCharges + taxAmount;

  const order = await Order.create({
    user: userId,
    orderId: `ORD${Date.now()}`,
    items,
    shippingAddress: normalizedShippingAddress,
    paymentMethod: paymentMethod || "COD",
    paymentStatus: "Pending",
    orderStatus: "Processing",
    totalAmount: subtotal,
    shippingCharges,
    taxAmount,
    finalAmount
  });

  await Cart.deleteMany({ user: userId });

  res.status(201).json({ success: true, order });
});
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const order = await Order.findOne({
    _id: id,
    user: userId
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  res.json({
    success: true,
    order
  });
});

const getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    totalOrders: orders.length,
    orders
  });
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders

};
