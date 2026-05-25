import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById } from '../api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setError('');
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!order) {
    return (
      <div className="page">
        <div className="container">
          <EmptyState
            title="Order not found"
            description={error || 'This order may not exist or you may not have access to it.'}
            actions={
              <>
                <button className="btn-gold" onClick={() => navigate('/orders')}>
                  Back to My Orders
                </button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  const steps = ['Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = steps.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'My Orders', to: '/orders' },
            { label: `#${order._id.slice(-6).toUpperCase()}` },
          ]}
          eyebrow="Order Details"
          title={
            <>
              Order <em>#{order._id.slice(-6).toUpperCase()}</em>
            </>
          }
          subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString()}. Track progress below and review items and shipping details.`}
          right={
            <Link
              to="/orders"
              className="btn-ghost"
              style={{ padding: '10px 16px', color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}
            >
              ← Back to Orders
            </Link>
          }
        />

      {isCancelled ? (
        <div className="auth-error" style={{ marginBottom: '48px' }}>This order has been cancelled.</div>
      ) : (
        <div className="order-timeline">
          {steps.map((step, idx) => {
            const isActive = currentStepIndex === idx;
            const isCompleted = currentStepIndex > idx;
            return (
              <div key={step} className={`timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-line"></div>
                <div className="timeline-label">{step}</div>
              </div>
            );
          })}
        </div>
      )}

        <div className="order-items-list">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '300', marginBottom: '24px' }}>Items</h3>
          {order.items.map((item) => (
            <div key={item._id || item.productId} className="order-item">
              <img src={item.image || '/premium/model-tote-premium.jpg'} alt={item.name} className="order-item-img" />
              <div>
                <div className="order-item-name">{item.name}</div>
                <div className="order-item-qty">Qty: {item.quantity}</div>
              </div>
              <div className="order-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="two-col" style={{ marginTop: 48 }}>
          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '300', marginBottom: '16px' }}>
              Shipping
            </h3>
            <div style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: '1.8' }}>
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.country} {order.shippingAddress.zipCode}
              <br />
              Phone: {order.shippingAddress.phone}
            </div>
            <div className="help-text" style={{ marginTop: 14 }}>
              Tip: If delivery details need to be updated, contact Client Care with this order ID.
            </div>
          </div>

          <div className="cart-summary" style={{ position: 'static' }}>
            <div className="cart-summary-title">Summary</div>
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">Rs. {order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Shipping</span>
              <span className="summary-value" style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                Free
              </span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total" style={{ marginBottom: 0 }}>
              <span className="summary-total-label">Total</span>
              <span className="summary-total-amount">Rs. {order.finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
