import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserOrders } from '../api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getUserOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'My Orders' },
          ]}
          eyebrow="Your History"
          title={
            <>
              My <em>Orders</em>
            </>
          }
          subtitle="Every order you place appears here. Open an order to see detailed items, shipping address, and the progress timeline."
        />

        {error ? (
          <EmptyState
            title="Can’t load orders right now"
            description={error}
            actions={
              <>
                <button className="btn-gold" onClick={fetchOrders}>
                  Try Again
                </button>
              </>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Once you place an order, you’ll see it here with a clear timeline (Processing → Shipped → Delivered)."
            actions={
              <>
                <button className="btn-gold" onClick={() => navigate('/shop')}>
                  Start Shopping
                </button>
              </>
            }
          />
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card" onClick={() => navigate(`/orders/${order._id}`)}>
                <div className="order-card-header">
                  <div className="order-card-id">#{order._id.slice(-6).toUpperCase()}</div>
                  <div className={`order-status-badge ${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</div>
                </div>
                <div className="order-card-body">
                  <div className="order-card-meta">
                    <div className="order-meta-item">
                      <div className="order-meta-label">Date</div>
                      <div className="order-meta-value">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="order-meta-item">
                      <div className="order-meta-label">Total</div>
                      <div className="order-meta-value">Rs. {order.finalAmount.toLocaleString()}</div>
                    </div>
                    <div className="order-meta-item">
                      <div className="order-meta-label">Items</div>
                      <div className="order-meta-value">{order.items.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
