import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, createOrder } from '../api';
import Toast from '../components/Toast';
import PageHeader from '../components/ui/PageHeader';
import InfoTip from '../components/ui/InfoTip';
import EmptyState from '../components/ui/EmptyState';

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      if (data.length === 0) navigate('/cart');
      setItems(data);
    } catch (err) {
      console.error(err);
      setLoadError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.zipCode || !formData.phone) {
      setErrorMsg('Please fill in all shipping fields');
      return;
    }
    setProcessing(true);
    setErrorMsg('');
    try {
      const order = await createOrder({
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          country: 'Pakistan',
          zipCode: formData.zipCode,
          phone: formData.phone
        },
        paymentMethod: 'COD'
      });
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
          subtitle="Add shipping details carefully (especially phone number) so delivery is smooth. Payment is Cash on Delivery."
        />

        {loadError ? (
          <EmptyState
            title="Checkout is unavailable right now"
            description={`${loadError}. If the backend is offline, you won’t be able to place an order. You can still browse the collection and try again later.`}
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

              <div className="card card--soft card-pad" style={{ marginBottom: 24 }}>
                <div className="help-text">
                  Need help? Read <Link to="/shipping-returns" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(197,160,89,0.35)' }}>Shipping &amp; Returns</Link> for timelines and policies.
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="checkout-section-title">
                  Shipping Details{' '}
                  <InfoTip tip="This address will be used for delivery. Double-check phone number so the courier can contact you." ariaLabel="Shipping help" />
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
                  <div className="help-text" style={{ marginTop: 8 }}>
                    Include house number + area/landmark for easier delivery.
                  </div>
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
                    Phone{' '}
                    <InfoTip tip="Use an active phone number so we/courier can confirm delivery." ariaLabel="Phone help" />
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

                <button type="submit" className="place-order-btn" disabled={processing}>
                  {processing ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span> Processing...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </form>
            </div>

            <div className="checkout-summary">
              <div className="checkout-summary-title">Order Summary</div>

              <div className="summary-items" style={{ marginBottom: '32px' }}>
                {items.map((item) => (
                  <div key={item.productId} className="summary-item">
                    <img src={item.image} alt={item.name} className="summary-item-img" />
                    <div>
                      <div className="summary-item-name">{item.name}</div>
                      <div className="summary-item-qty">Qty: {item.quantity}</div>
                      <div className="summary-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
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
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-amount">Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
