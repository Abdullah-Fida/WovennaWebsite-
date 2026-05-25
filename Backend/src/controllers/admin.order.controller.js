const asyncHandler = require('express-async-handler');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  res.json({ success: true, orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findById(id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (!['Processing','Shipped','Delivered','Cancelled'].includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }
  order.orderStatus = status;
  await order.save();
  res.json({ success: true, order });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  
  const revenueResult = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');

  res.json({
    success: true,
    stats: { totalOrders, totalRevenue, totalUsers, totalProducts },
    recentOrders
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

module.exports = { getAllOrders, updateOrderStatus, getDashboardStats, getAllUsers };
