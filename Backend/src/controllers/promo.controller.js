const asyncHandler = require('express-async-handler');
const Promo = require('../models/promo.model');

// Validate a promo code
// POST /api/promos/validate
const validatePromo = asyncHandler(async (req, res) => {
  const { code, cartTotal, cartItems } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Please provide a promo code');
  }

  const promo = await Promo.findOne({ code: code.toUpperCase() });

  if (!promo) {
    res.status(404);
    throw new Error('Invalid promo code');
  }

  if (!promo.isActive) {
    res.status(400);
    throw new Error('Promo code is disabled');
  }

  if (new Date(promo.expirationDate) < new Date()) {
    res.status(400);
    throw new Error('Promo code has expired');
  }

  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    res.status(400);
    throw new Error('Promo code usage limit reached');
  }

  if (cartTotal < promo.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount of Rs. ${promo.minOrderAmount} required for this promo`);
  }

  // Calculate discount based on applicable products or cart total
  let discountAmount = 0;
  
  if (promo.applicableProducts && promo.applicableProducts.length > 0) {
    // If specific products are targeted, calculate discount only on those items
    let applicableTotal = 0;
    
    // Check if cart has any applicable products
    const hasApplicableProduct = cartItems.some(item => 
      promo.applicableProducts.includes(item.productId || item._id) // Assuming item could have productId or _id depending on frontend
    );

    if (!hasApplicableProduct) {
      res.status(400);
      throw new Error('This promo code does not apply to any items in your cart');
    }

    cartItems.forEach(item => {
      const id = item.productId || item._id;
      if (promo.applicableProducts.includes(id)) {
        applicableTotal += (item.price * item.quantity);
      }
    });

    if (promo.discountType === 'percentage') {
      discountAmount = (applicableTotal * promo.discountValue) / 100;
    } else if (promo.discountType === 'fixed') {
      discountAmount = promo.discountValue;
      // Cap discount at applicable total
      if (discountAmount > applicableTotal) discountAmount = applicableTotal;
    }
  } else {
    // Apply to whole cart
    if (promo.discountType === 'percentage') {
      discountAmount = (cartTotal * promo.discountValue) / 100;
    } else if (promo.discountType === 'fixed') {
      discountAmount = promo.discountValue;
    }
    // Cap discount at cart total
    if (discountAmount > cartTotal) discountAmount = cartTotal;
  }

  res.json({
    message: 'Promo code applied successfully',
    discountAmount: Math.round(discountAmount),
    promoCode: promo.code,
    promoId: promo._id
  });
});

module.exports = {
  validatePromo
};
