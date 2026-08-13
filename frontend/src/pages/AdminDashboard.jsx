import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav';
import { getAdminStats } from '../api';
import Toast from '../components/Toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load dashboard stats');
        setToastMsg(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="admin-header">
        <h1>Admin <em>Dashboard</em></h1>
      </div>

      <AdminNav active="overview" />

      {error ? (
        <div className="state-panel">
          <h3>Could not load dashboard</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Total Revenue</div>
              <div className="stat-card-value gold">Rs. {(stats?.stats?.totalRevenue || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Total Orders</div>
              <div className="stat-card-value">{stats?.stats?.totalOrders || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Products</div>
              <div className="stat-card-value">{stats?.stats?.totalProducts || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Users</div>
              <div className="stat-card-value">{stats?.stats?.totalUsers || 0}</div>
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
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id?.slice(-6).toUpperCase()}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                      <td>{order.user?.name || 'Guest'}</td>
                      <td>Rs. {(order.finalAmount || 0).toLocaleString()}</td>
                      <td><span className={`order-status-badge ${(order.orderStatus || '').toLowerCase()}`}>{order.orderStatus || 'Unknown'}</span></td>
                      <td><Link to="/admin/orders" className="admin-btn admin-btn-primary admin-btn-sm">View</Link></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray)' }}>No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
