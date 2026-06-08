import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers, toggleUserStatus } from '../api';
import Toast from '../components/Toast';
import InfoTip from '../components/ui/InfoTip';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data.users || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    setToggling(userId);
    try {
      await toggleUserStatus(userId);
      setToastMsg('User status updated');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setToastMsg('Failed to update user status');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.isActive !== false).length;

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      
      <div className="admin-header">
        <h1>Manage <em>Users</em></h1>
      </div>

      <div className="card card--soft card-pad" style={{ marginBottom: 26 }}>
        <div className="help-text">
          User management <InfoTip tip="View all registered users and toggle their active status. Inactive users cannot log in." ariaLabel="Users help" />:
          <ul className="help-list">
            <li><strong>Active</strong>: user can browse, add to cart, and place orders.</li>
            <li><strong>Inactive</strong>: user account is suspended and cannot log in.</li>
            <li><strong>Role</strong>: "admin" users have access to this dashboard.</li>
          </ul>
        </div>
      </div>

      <div className="admin-nav">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/users" className="active">Users</Link>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Customers</div>
          <div className="stat-card-value">{totalCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Admins</div>
          <div className="stat-card-value gold">{totalAdmins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active</div>
          <div className="stat-card-value">{activeUsers}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{ opacity: user.isActive === false ? 0.55 : 1 }}>
                <td style={{ fontWeight: 400 }}>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '—'}</td>
                <td>
                  <span className={`admin-role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`admin-status-indicator ${user.isActive !== false ? 'active' : 'inactive'}`}>
                    {user.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {user.role !== 'admin' ? (
                    <button
                      className={`admin-btn admin-btn-sm ${user.isActive !== false ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                      onClick={() => handleToggleStatus(user._id)}
                      disabled={toggling === user._id}
                    >
                      {toggling === user._id ? '...' : user.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--gray)', letterSpacing: '1px' }}>PROTECTED</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
