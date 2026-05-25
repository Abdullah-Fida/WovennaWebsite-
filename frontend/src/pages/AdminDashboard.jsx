import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../api';
import InfoTip from '../components/ui/InfoTip';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin <em>Dashboard</em></h1>
      </div>

      <div className="card card--soft card-pad" style={{ marginBottom: 26 }}>
        <div className="help-text">
          Overview <InfoTip tip="Use Orders to update statuses and Products to create/edit items. Stats update from the backend." ariaLabel="Admin overview" />:
          <ul className="help-list">
            <li>Orders: update Processing → Shipped → Delivered</li>
            <li>Products: add images, stock, category, price</li>
            <li>Revenue: total of successful orders</li>
          </ul>
        </div>
      </div>

      <div className="admin-nav">
        <Link to="/admin" className="active">Overview</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/products">Products</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value gold">Rs. {stats.stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-value">{stats.stats.totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Products</div>
          <div className="stat-card-value">{stats.stats.totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Users</div>
          <div className="stat-card-value">{stats.stats.totalUsers}</div>
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: '24px', marginTop: '64px' }}>Recent <em>Orders</em></h2>
      <div className="admin-table-wrap" style={{ marginTop: '24px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map(order => (
              <tr key={order._id}>
                <td>#{order._id.slice(-6).toUpperCase()}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.user?.name || 'Guest'}</td>
                <td>Rs. {order.finalAmount.toLocaleString()}</td>
                <td><span className={`order-status-badge ${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></td>
                <td><Link to="/admin/orders" className="admin-btn admin-btn-primary admin-btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
