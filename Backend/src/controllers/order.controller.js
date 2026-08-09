const asyncHandler = require("express-async-handler");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Promo = require("../models/promo.model");
const { sendOrderConfirmationEmail } = require("../utils/email.service");

// Generate unique order ID
const generateOrderId = () => {
  return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// CREATE ORDER
const createOrder = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const userId = req.user._id;
  const { shippingAddress, paymentMethod, promoCode } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({ message: "Shipping address missing" });
  }

  // Normalize common frontend field names to match the schema
  const normalizedShippingAddress = {
    street: shippingAddress.street || shippingAddress.address || "",
    city: shippingAddress.city || "",
    country: shippingAddress.country || "Pakistan",
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
      image: item.image || '',
      color: item.color || '',
      size: item.size || '',
      quantity: item.quantity
    };
  });

  const shippingCharges = subtotal > 500 ? 0 : 50;
  const taxAmount = Math.round(subtotal * 0.18);

  // Promo code handling
  let discountAmount = 0;
  let appliedPromoCode = null;

  if (promoCode) {
    const promo = await Promo.findOne({ code: promoCode.toUpperCase(), isActive: true });

    if (promo && new Date(promo.expirationDate) >= new Date()) {
      if (promo.usageLimit === null || promo.usageCount < promo.usageLimit) {
        if (subtotal >= promo.minOrderAmount) {
          // Calculate discount based on applicable products or whole cart
          if (promo.applicableProducts && promo.applicableProducts.length > 0) {
            let applicableTotal = 0;
            items.forEach(item => {
              if (promo.applicableProducts.some(pid => pid.toString() === item.productId.toString())) {
                applicableTotal += (item.price * item.quantity);
              }
            });
            if (promo.discountType === 'percentage') {
              discountAmount = Math.round((applicableTotal * promo.discountValue) / 100);
            } else {
              discountAmount = Math.min(promo.discountValue, applicableTotal);
            }
          } else {
            if (promo.discountType === 'percentage') {
              discountAmount = Math.round((subtotal * promo.discountValue) / 100);
            } else {
              discountAmount = Math.min(promo.discountValue, subtotal);
            }
          }
          appliedPromoCode = promo.code;
          promo.usageCount += 1;
          await promo.save();
        }
      }
    }
  }

  const finalAmount = subtotal + shippingCharges + taxAmount - discountAmount;

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
    finalAmount,
    promoCode: appliedPromoCode,
    discountAmount
  });

  await Cart.deleteMany({ user: userId });

  // Send confirmation email asynchronously (don't await so it doesn't block response)
  sendOrderConfirmationEmail(req.user.email, order).catch(err => console.error("Email failed:", err));

  res.status(201).json({ success: true, order });
});

// CREATE GUEST ORDER (no authentication required)
const createGuestOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, promoCode, items: cartItems, guestName, guestEmail } = req.body;

  if (!guestName || !guestEmail) {
    return res.status(400).json({ message: "Guest name and email are required" });
  }

  if (!shippingAddress) {
    return res.status(400).json({ message: "Shipping address missing" });
  }

  const normalizedShippingAddress = {
    street: shippingAddress.street || shippingAddress.address || "",
    city: shippingAddress.city || "",
    country: shippingAddress.country || "Pakistan",
    zipCode: shippingAddress.zipCode || shippingAddress.postalCode || "",
    phone: shippingAddress.phone || "",
  };

  if (!normalizedShippingAddress.street || !normalizedShippingAddress.zipCode) {
    return res.status(400).json({
      message: "Shipping address is incomplete (street and zipCode are required)",
    });
  }

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // Guests post their own cart, so prices must be re-read from the database
  // rather than trusted from the browser.
  let subtotal = 0;
  const items = [];

  for (const item of cartItems) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid cart item data" });
    }

    const product = await Product.findById(item.productId);
    if (!product || product.isActive === false) {
      return res.status(400).json({ message: `"${item.name || 'A product'}" is no longer available` });
    }
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} left in stock for ${product.name}`
      });
    }

    subtotal += product.price * quantity;
    items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: (product.images && product.images[0]) || '',
      color: item.color || '',
      size: item.size || '',
      quantity
    });
  }

  const shippingCharges = subtotal > 500 ? 0 : 50;
  const taxAmount = Math.round(subtotal * 0.18);

  // Promo code handling
  let discountAmount = 0;
  let appliedPromoCode = null;

  if (promoCode) {
    const promo = await Promo.findOne({ code: promoCode.toUpperCase(), isActive: true });
    if (promo && new Date(promo.expirationDate) >= new Date()) {
      if (promo.usageLimit === null || promo.usageCount < promo.usageLimit) {
        if (subtotal >= promo.minOrderAmount) {
          if (promo.applicableProducts && promo.applicableProducts.length > 0) {
            let applicableTotal = 0;
            items.forEach(item => {
              if (promo.applicableProducts.some(pid => pid.toString() === item.productId.toString())) {
                applicableTotal += (item.price * item.quantity);
              }
            });
            if (promo.discountType === 'percentage') {
              discountAmount = Math.round((applicableTotal * promo.discountValue) / 100);
            } else {
              discountAmount = Math.min(promo.discountValue, applicableTotal);
            }
          } else {
            if (promo.discountType === 'percentage') {
              discountAmount = Math.round((subtotal * promo.discountValue) / 100);
            } else {
              discountAmount = Math.min(promo.discountValue, subtotal);
            }
          }
          appliedPromoCode = promo.code;
          promo.usageCount += 1;
          await promo.save();
        }
      }
    }
  }

  const finalAmount = subtotal + shippingCharges + taxAmount - discountAmount;

  const order = await Order.create({
    orderId: `ORD${Date.now()}`,
    items,
    shippingAddress: normalizedShippingAddress,
    paymentMethod: paymentMethod || "COD",
    paymentStatus: "Pending",
    orderStatus: "Processing",
    totalAmount: subtotal,
    shippingCharges,
    taxAmount,
    finalAmount,
    promoCode: appliedPromoCode,
    discountAmount,
    guestName,
    guestEmail
  });

  // Send confirmation email asynchronously
  sendOrderConfirmationEmail(guestEmail, order).catch(err => console.error("Guest email failed:", err));

  res.status(201).json({ success: true, order });
});

// TRACK ORDER (public) — guests look up an order with its number plus the
// email they checked out with, so an order id alone never exposes an address.
const trackOrder = asyncHandler(async (req, res) => {
  const orderId = String(req.body.orderId || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!orderId || !email) {
    return res.status(400).json({ message: 'Order number and email are both required' });
  }

  // Accept either the human-facing "ORD..." number or the raw database id.
  const query = { orderId: new RegExp(`^${orderId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  let order = await Order.findOne(query).populate('user', 'email name');

  if (!order && /^[0-9a-fA-F]{24}$/.test(orderId)) {
    order = await Order.findById(orderId).populate('user', 'email name');
  }

  if (!order) {
    return res.status(404).json({ message: 'No order found with that number' });
  }

  const orderEmail = (order.guestEmail || order.user?.email || '').toLowerCase();
  if (orderEmail !== email) {
    return res.status(404).json({ message: 'No order found with that number and email' });
  }

  res.json({ success: true, order });
});

// GET ORDER BY ID
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // If user is authenticated, filter by user; otherwise allow guest order lookup by id
  let order;
  if (req.user) {
    order = await Order.findOne({ _id: id, user: req.user._id });
  }
  // If not found for logged-in user, or no user, try finding by just _id (guest orders)
  if (!order) {
    order = await Order.findById(id);
  }

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

// GET USER ORDERS
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    totalOrders: orders.length,
    orders
  });
});

module.exports = {
  createOrder,
  createGuestOrder,
  trackOrder,
  getOrderById,
  getUserOrders
};
