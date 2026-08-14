import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder, createGuestOrder, validatePromoCode } from '../api';
import { getReferral } from '../lib/referral';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SmartImage from '../components/ui/SmartImage';
import { rememberGuestOrder } from '../guestOrders';
import Toast from '../components/Toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function Checkout() {
  const { items, subtotal: total, loading, error: loadError, resetCart, lineKeyOf } = useCart();
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Promo state
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null); // { code, discountAmount }
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    zipCode: '',
    phone: '',
    // Guest-only fields
    guestName: '',
    guestEmail: ''
  });

  // Send shoppers back to the cart if there is nothing left to check out —
  // but not while the order is being placed, since the cart empties then.
  useEffect(() => {
    if (!loading && !processing && items.length === 0) {
      navigate('/cart');
    }
  }, [loading, processing, items.length, navigate]);

  const discountAmount = promoApplied ? promoApplied.discountAmount : 0;
  const finalTotal = total - discountAmount;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    try {
      const result = await validatePromoCode({
        code: promoInput.trim(),
        cartTotal: total,
        cartItems: items.map(item => ({
          productId: item.productId,
          price: item.price,
          quantity: item.quantity
        }))
      });
      setPromoApplied({
        code: result.promoCode,
        discountAmount: result.discountAmount
      });
      setPromoError('');
    } catch (err) {
      setPromoError(err.message || 'Invalid promo code');
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoInput('');
    setPromoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.zipCode || !formData.phone) {
      setErrorMsg('Please fill in all shipping fields');
      return;
    }
    // Validate guest fields
    if (!user) {
      if (!formData.guestName.trim()) {
        setErrorMsg('Please enter your full name');
        return;
      }
      if (!formData.guestEmail.trim() || !formData.guestEmail.includes('@')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
    }
    setProcessing(true);
    setErrorMsg('');
    try {
      let order;
      if (user) {
        order = await createOrder({
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            country: 'Pakistan',
            zipCode: formData.zipCode,
            phone: formData.phone
          },
          paymentMethod: 'COD',
          promoCode: promoApplied ? promoApplied.code : null,
          referralCode: getReferral()
        });
      } else {
        // Guest checkout
        order = await createGuestOrder({
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            color: item.color || '',
            size: item.size || ''
          })),
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            country: 'Pakistan',
            zipCode: formData.zipCode,
            phone: formData.phone
          },
          paymentMethod: 'COD',
          promoCode: promoApplied ? promoApplied.code : null,
          referralCode: getReferral(),
          guestName: formData.guestName.trim(),
          guestEmail: formData.guestEmail.trim()
        });
        // Keep a local receipt so the guest can find this order again.
        rememberGuestOrder(order, formData.guestEmail.trim());
      }
      resetCart();
      navigate(`/order-success/${order._id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order');
      setProcessing(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="container">
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />

        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Cart', to: '/cart' },
            { label: 'Checkout' },
          ]}
          eyebrow="Secure Checkout"
          title={
            <>
              Complete your <em>order</em>
            </>
          }
        />

        {loadError ? (
          <EmptyState
            title="Checkout is unavailable right now"
            description="We couldn’t load your order just now. Please try again in a moment."
            actions={
              <>
                <Link to="/cart" className="btn-gold">
                  Back to Cart
                </Link>
              </>
            }
          />
        ) : (
          <div className="checkout-inner">
            <div className="checkout-form-section">
              {errorMsg && <div className="auth-error" style={{ marginBottom: '24px' }}>{errorMsg}</div>}

              {/* Named so the Place Order button can live under the total in
                  the summary column, where shoppers expect it, and still
                  submit this form. */}
              <form id="checkout-form" onSubmit={handleSubmit}>
                {/* Guest Contact Info */}
                {!user && (
                  <>
                    <div className="checkout-section-title">
                      Contact Information
                    </div>

                    <div className="guest-checkout-notice">
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ stroke: 'var(--gold)', fill: 'none', strokeWidth: 1.5, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>You're checking out as a <strong>guest</strong>. <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link> or <Link to="/register" style={{ color: 'var(--gold)' }}>create an account</Link> to track your orders.</span>
                    </div>

                    <div className="checkout-form-row">
                      <div className="checkout-form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={formData.guestName}
                          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="checkout-form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={formData.guestEmail}
                          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                          required
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="checkout-section-title">
                  Shipping Details
                </div>

                <div className="checkout-form-group">
                  <label>Street</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    required
                    placeholder="House no, street, area"
                  />
                </div>

                <div className="checkout-form-row">
                  <div className="checkout-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="City"
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
                      placeholder="Postal / Zip code"
                    />
                  </div>
                </div>

                <div className="checkout-form-group">
                  <label>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="03XX XXXXXXX"
                  />
                </div>

                <div className="checkout-section-title" style={{ marginTop: '48px' }}>
                  Payment
                </div>

                <div className="cod-badge">
                  <svg viewBox="0 0 24 24">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <div className="cod-badge-text">
                    <h4>Cash on Delivery</h4>
                    <p>Pay when you receive your order.</p>
                  </div>
                </div>

              </form>
            </div>

            <div className="checkout-summary">
              <div className="checkout-summary-title">Order Summary</div>

              <div className="summary-items" style={{ marginBottom: '32px' }}>
                {items.map((item) => (
                  <div key={lineKeyOf(item)} className="summary-item">
                    <SmartImage
                      src={item.image}
                      alt={item.name}
                      className="summary-item-img"
                      width={180}
                      sizes="90px"
                    />
                    <div>
                      <div className="summary-item-name">{item.name}</div>
                      {(item.color || item.size) && (
                        <div className="summary-item-qty">{[item.color, item.size].filter(Boolean).join(' / ')}</div>
                      )}
                      <div className="summary-item-qty">Qty: {item.quantity}</div>
                      <div className="summary-item-price">Rs. {((item.price || 0) * (item.quantity || 0)).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Section */}
              <div className="promo-section">
                <div className="promo-section-label">Promo Code</div>
                {promoApplied ? (
                  <div className="promo-applied-badge">
                    <div className="promo-applied-info">
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ stroke: '#22c55e', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="promo-applied-code">{promoApplied.code}</span>
                      <span className="promo-applied-discount">−Rs. {promoApplied.discountAmount.toLocaleString()}</span>
                    </div>
                    <button className="promo-remove-btn" onClick={handleRemovePromo}>Remove</button>
                  </div>
                ) : (
                  <div className="promo-input-row">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="promo-input"
                    />
                    <button
                      type="button"
                      className="promo-apply-btn"
                      onClick={handleApplyPromo}
                      disabled={promoLoading}
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {promoError && <div className="promo-error">{promoError}</div>}
              </div>

              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">Rs. {total.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-value" style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                  Free
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row">
                  <span className="summary-label" style={{ color: '#22c55e' }}>Discount</span>
                  <span className="summary-value" style={{ color: '#22c55e' }}>−Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-amount">Rs. {finalTotal.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="place-order-btn"
                disabled={processing}
              >
                {processing ? (
                  <span className="btn-loading">
                    <span className="btn-spinner"></span> Processing...
                  </span>
                ) : (
                  `Place Order · Rs. ${finalTotal.toLocaleString()}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
