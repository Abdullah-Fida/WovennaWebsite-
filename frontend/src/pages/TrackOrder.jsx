import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { trackOrder } from '../api';
import { getGuestOrders } from '../guestOrders';
import PageHeader from '../components/ui/PageHeader';
import InfoTip from '../components/ui/InfoTip';

const STAGES = ['Processing', 'Shipped', 'Delivered'];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const recent = getGuestOrders();

  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = async (e, presetId, presetEmail) => {
    if (e) e.preventDefault();
    const id = (presetId ?? orderId).trim();
    const mail = (presetEmail ?? email).trim();

    if (!id || !mail) {
      setError('Please enter both your order number and email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const found = await trackOrder({ orderId: id, email: mail });
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setError(err.message || 'Could not find that order');
    } finally {
      setLoading(false);
    }
  };

  const stageIndex = order ? STAGES.indexOf(order.orderStatus) : -1;
  const cancelled = order?.orderStatus === 'Cancelled';

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Track Order' }]}
          eyebrow="Order Status"
          title={<>Track your <em>order</em></>}
          subtitle="Enter the order number from your confirmation along with the email you used at checkout. No account needed."
        />

        <div className="track-layout">
          <div>
            <form className="card card--soft card-pad track-form" onSubmit={lookup}>
              <div className="checkout-form-group">
                <label>
                  Order Number{' '}
                  <InfoTip tip="Looks like ORD1786296232854 — it's in your confirmation email and on the order success page." ariaLabel="Order number help" />
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ORD..."
                />
              </div>

              <div className="checkout-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

              <button type="submit" className="btn-gold track-submit" disabled={loading}>
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </form>

            {recent.length > 0 && (
              <div className="card card--soft card-pad" style={{ marginTop: 22 }}>
                <div className="track-recent-title">Recent orders from this device</div>
                <ul className="track-recent-list">
                  {recent.map((o) => (
                    <li key={o._id}>
                      <button
                        type="button"
                        className="track-recent-item"
                        onClick={() => {
                          setOrderId(o.orderId || o._id);
                          setEmail(o.email);
                          lookup(null, o.orderId || o._id, o.email);
                        }}
                      >
                        <span className="track-recent-id">{o.orderId || o._id.slice(-6).toUpperCase()}</span>
                        <span className="track-recent-meta">
                          {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                          {o.total ? ` · Rs. ${o.total.toLocaleString()}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            {order ? (
              <div className="card card--soft card-pad">
                <div className="track-result-head">
                  <div>
                    <div className="track-result-label">Order</div>
                    <div className="track-result-id">{order.orderId}</div>
                  </div>
                  <span className={`track-status-pill ${cancelled ? 'is-cancelled' : ''}`}>
                    {order.orderStatus}
                  </span>
                </div>

                {!cancelled && (
                  <div className="track-steps">
                    {STAGES.map((stage, i) => (
                      <div
                        key={stage}
                        className={`track-step ${i <= stageIndex ? 'is-done' : ''}`}
                      >
                        <span className="track-step-dot" />
                        <span className="track-step-label">{stage}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="track-items">
                  {order.items.map((item, i) => (
                    <div key={i} className="track-item">
                      <img
                        src={item.image || '/premium/flatlay-marble.jpg'}
                        alt={item.name}
                        onError={(e) => { e.currentTarget.src = '/premium/flatlay-marble.jpg'; }}
                      />
                      <div>
                        <div className="track-item-name">{item.name}</div>
                        <div className="track-item-meta">
                          Qty {item.quantity} · Rs. {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-row">
                  <span className="summary-label">Payment</span>
                  <span className="summary-value">{order.paymentMethod} · {order.paymentStatus}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Delivering to</span>
                  <span className="summary-value">
                    {order.shippingAddress?.city}, {order.shippingAddress?.country}
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-total">
                  <span className="summary-total-label">Total</span>
                  <span className="summary-total-amount">Rs. {order.finalAmount?.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="card card--soft card-pad track-placeholder">
                <p className="help-text" style={{ marginBottom: 12 }}>
                  Your order details will appear here once we find it.
                </p>
                <p className="help-text">
                  Can’t find your order number? Check the confirmation email we sent, or{' '}
                  <Link to="/contact" style={{ color: 'var(--gold)' }}>contact us</Link> and
                  we’ll look it up for you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
