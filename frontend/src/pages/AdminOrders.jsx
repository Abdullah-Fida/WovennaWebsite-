import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../api';
import Toast from '../components/Toast';
import InfoTip from '../components/ui/InfoTip';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError('');
      const data = await getAdminOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load orders');
      setToastMsg(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setToastMsg(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setToastMsg(err.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      
      <div className="admin-header">
        <h1>Manage <em>Orders</em></h1>
      </div>

      <div className="card card--soft card-pad" style={{ marginBottom: 26 }}>
        <div className="help-text">
          Status meanings <InfoTip tip="Updating status changes what customers see in their order timeline." ariaLabel="Status help" />:
          <ul className="help-list">
            <li><strong>Processing</strong>: order received + being prepared</li>
            <li><strong>Shipped</strong>: handed over to courier</li>
            <li><strong>Delivered</strong>: delivered successfully</li>
            <li><strong>Cancelled</strong>: stopped/cancelled (timeline will show cancelled)</li>
          </ul>
        </div>
      </div>

      <div className="admin-nav">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/orders" className="active">Orders</Link>
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/promos">Promos</Link>
      </div>

      {error ? (
        <div className="state-panel">
          <h3>Could not load orders</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={fetchOrders}>Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="state-panel">
          <h3>No orders yet</h3>
          <p>Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>#{order._id?.slice(-6).toUpperCase()}</td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    {order.user?.name || 'Guest'}<br/>
                    <small style={{ color: 'var(--gray)', fontSize: '11px' }}>{order.shippingAddress?.phone || '—'}</small>
                  </td>
                  <td>{order.items?.length || 0}</td>
                  <td>Rs. {(order.finalAmount || 0).toLocaleString()}</td>
                  <td><span className={`order-status-badge ${(order.orderStatus || '').toLowerCase()}`}>{order.orderStatus || 'Unknown'}</span></td>
                  <td>
                    <select 
                      className="status-select" 
                      value={order.orderStatus || 'Processing'}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
