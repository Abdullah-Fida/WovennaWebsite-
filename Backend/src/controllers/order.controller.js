const asyncHandler = require("express-async-handler");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Promo = require("../models/promo.model");
const User = require("../models/user.model");
const Influencer = require("../models/influencer.model");

/**
 * Work out who, if anyone, gets credit for this order.
 *
 * The code may arrive either as the promo the shopper typed or as the `ref`
 * carried from an influencer's link — both are the same string. Commission is
 * computed here and frozen onto the order, so changing an influencer's rate
 * later never rewrites what they have already earned. It is paid on the
 * subtotal, never on shipping or tax.
 */
async function resolveReferral(code, subtotal) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return { influencer: null, referralCode: null, commissionAmount: 0 };

  const influencer = await Influencer.findOne({ code: clean, status: 'approved' });
  if (!influencer) return { influencer: null, referralCode: null, commissionAmount: 0 };

  return {
    influencer: influencer._id,
    referralCode: influencer.code,
    commissionAmount: Math.round((subtotal * influencer.commissionRate) / 100),
  };
}

// User input goes into a RegExp for case-insensitive matching, so escape it.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const referral = await resolveReferral(req.body.referralCode || promoCode, subtotal);

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
    discountAmount,
    ...referral
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

    // Price, photo and stock all come from the chosen variant when there is
    // one, so a guest cart cannot post its own figures.
    const variant = (product.variants || []).find(
      (v) => (v.color || '') === (item.color || '') && (v.size || '') === (item.size || '')
    );
    const stock = variant ? Number(variant.stock) || 0 : Number(product.stock) || 0;
    const price = variant && Number(variant.price) > 0 ? Number(variant.price) : Number(product.price);
    const image = (variant && variant.image) || (product.images && product.images[0]) || '';

    if (stock < quantity) {
      const label = [item.color, item.size].filter(Boolean).join(' / ');
      return res.status(400).json({
        message: `Only ${stock} left in stock for ${product.name}${label ? ` (${label})` : ''}`
      });
    }

    subtotal += price * quantity;
    items.push({
      productId: product._id,
      name: product.name,
      price,
      image,
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
  const referral = await resolveReferral(req.body.referralCode || promoCode, subtotal);

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
    guestEmail,
    ...referral
  });

  // Send confirmation email asynchronously
  sendOrderConfirmationEmail(guestEmail, order).catch(err => console.error("Guest email failed:", err));

  res.status(201).json({ success: true, order });
});

// TRACK ORDER (public). The email is always required and must match the
// order, so an order number alone never exposes someone's address. The order
// number is optional — with just an email we return that address's recent
// orders so a shopper who lost their number can still find them.
const trackOrder = asyncHandler(async (req, res) => {
  const orderId = String(req.body.orderId || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: 'Please enter the email you used at checkout' });
  }

  // Orders placed by a signed-in user store the email on the user document.
  const usersWithEmail = await User.find({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') })
    .select('_id');
  const emailFilter = {
    $or: [
      { guestEmail: new RegExp(`^${escapeRegex(email)}$`, 'i') },
      ...(usersWithEmail.length ? [{ user: { $in: usersWithEmail.map((u) => u._id) } }] : []),
    ],
  };

  if (orderId) {
    const idFilter = { $or: [{ orderId: new RegExp(`^${escapeRegex(orderId)}$`, 'i') }] };
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) idFilter.$or.push({ _id: orderId });

    const order = await Order.findOne({ $and: [idFilter, emailFilter] });
    if (!order) {
      return res.status(404).json({ message: 'No order found with that number and email' });
    }
    return res.json({ success: true, order });
  }

  const orders = await Order.find(emailFilter).sort({ createdAt: -1 }).limit(10);
  if (orders.length === 0) {
    return res.status(404).json({ message: 'No orders found for that email' });
  }

  res.json({ success: true, order: orders[0], orders });
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
