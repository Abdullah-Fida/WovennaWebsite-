import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav';
import { getAdminUsers, toggleUserStatus } from '../api';
import Toast from '../components/Toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toggling, setToggling] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError('');
      const data = await getAdminUsers();
      setUsers(data.users || data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load users');
      setToastMsg(err.message || 'Failed to load users');
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
      setToastMsg(err.message || 'Failed to update user status');
    } finally {
      setToggling(null);
    }
  };

  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.isActive !== false).length;

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      
      <div className="admin-header">
        <h1>Manage <em>Users</em></h1>
      </div>

      <AdminNav active="users" />

      {/* The header and tabs stay put while data loads, so moving between
          admin sections never blanks the whole screen. */}
      {loading ? (
        <div className="page-loader"><div className="spinner"></div></div>
      ) : error ? (
        <div className="state-panel">
          <h3>Could not load users</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={fetchUsers}>Try Again</button>
        </div>
      ) : (
        <>
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
                {users.length > 0 ? users.map(user => (
                  <tr key={user._id} style={{ opacity: user.isActive === false ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 400 }}>{user.name || '—'}</td>
                    <td>{user.email || '—'}</td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <span className={`admin-role-badge ${user.role || 'customer'}`}>
                        {user.role || 'customer'}
                      </span>
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
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
                )) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray)' }}>No users found</td>
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
