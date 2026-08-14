import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../api';
import Toast from '../components/Toast';
import AdminNav from '../components/admin/AdminNav';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

const customerName = (o) => o.user?.name || o.guestName || 'Guest';
const customerEmail = (o) => o.user?.email || o.guestEmail || '';

// One block a courier can read top to bottom.
const formatAddress = (o) => {
  const a = o.shippingAddress || {};
  return [
    customerName(o),
    a.phone,
    a.street,
    [a.city, a.zipCode].filter(Boolean).join(' '),
    a.country,
  ]
    .filter(Boolean)
    .join('\n');
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [savingId, setSavingId] = useState('');

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
    const previous = orders;
    // Move the badge immediately; a failed save rolls it back.
    setSavingId(id);
    setOrders((cur) => cur.map((o) => (o._id === id ? { ...o, orderStatus: newStatus } : o)));
    try {
      await updateOrderStatus(id, newStatus);
      setToastMsg(`Order marked ${newStatus}`);
    } catch (err) {
      console.error(err);
      setOrders(previous);
      setToastMsg(err.message || 'Failed to update status');
    } finally {
      setSavingId('');
    }
  };

  const copyAddress = async (order) => {
    try {
      await navigator.clipboard.writeText(formatAddress(order));
      setToastMsg('Address copied');
    } catch {
      setToastMsg('Could not copy — select the text instead');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.orderStatus !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        o.orderId,
        o._id,
        customerName(o),
        customerEmail(o),
        o.shippingAddress?.phone,
        o.shippingAddress?.city,
        o.shippingAddress?.street,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, query, statusFilter]);

  const counts = useMemo(() => {
    const base = { All: orders.length };
    STATUSES.forEach((s) => {
      base[s] = orders.filter((o) => o.orderStatus === s).length;
    });
    return base;
  }, [orders]);

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="admin-header">
        <h1>Manage <em>Orders</em></h1>
      </div>

      <AdminNav active="orders" />

      <div className="admin-toolbar">
        <div className="admin-filter-row">
          {['All', ...STATUSES].map((s) => (
            <button
              key={s}
              type="button"
              className={`admin-chip ${statusFilter === s ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s} <span>{counts[s] || 0}</span>
            </button>
          ))}
        </div>
        <input
          className="admin-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order no, name, phone, city…"
          aria-label="Search orders"
        />
      </div>

      {/* The header and tabs stay put while data loads, so moving between
          admin sections never blanks the whole screen. */}
      {loading ? (
        <div className="page-loader"><div className="spinner"></div></div>
      ) : error ? (
        <div className="state-panel">
          <h3>Could not load orders</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={fetchOrders}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-panel">
          <h3>{orders.length === 0 ? 'No orders yet' : 'No orders match this filter'}</h3>
          <p>
            {orders.length === 0
              ? 'Orders placed by customers will appear here.'
              : 'Try a different status or clear the search.'}
          </p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {filtered.map((order) => {
            const isOpen = expanded === order._id;
            const addr = order.shippingAddress || {};
            return (
              <div key={order._id} className={`admin-order ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="admin-order-head"
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                  aria-expanded={isOpen}
                >
                  <div className="admin-order-id">
                    <span className="admin-order-no">{order.orderId || `#${order._id.slice(-6).toUpperCase()}`}</span>
                    <span className="admin-order-date">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>

                  <div className="admin-order-cust">
                    <span className="admin-order-name">{customerName(order)}</span>
                    <span className="admin-order-sub">
                      {addr.city || '—'}
                      {addr.phone ? ` · ${addr.phone}` : ''}
                    </span>
                  </div>

                  <div className="admin-order-meta">
                    <span className="admin-order-items">
                      {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                    </span>
                    <span className="admin-order-total">Rs. {(order.finalAmount || 0).toLocaleString()}</span>
                  </div>

                  <span className={`order-status-badge ${(order.orderStatus || '').toLowerCase()}`}>
                    {order.orderStatus || 'Unknown'}
                  </span>

                  <svg className="admin-order-caret" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="admin-order-body">
                    <div className="admin-order-cols">
                      <section className="admin-order-block">
                        <h4>
                          Delivery address
                          <button type="button" className="admin-copy-btn" onClick={() => copyAddress(order)}>
                            Copy
                          </button>
                        </h4>
                        <address className="admin-address">
                          <strong>{customerName(order)}</strong>
                          {addr.phone && (
                            <a href={`tel:${addr.phone}`} className="admin-address-phone">{addr.phone}</a>
                          )}
                          <span>{addr.street || <em>No street recorded</em>}</span>
                          <span>{[addr.city, addr.zipCode].filter(Boolean).join(' ') || '—'}</span>
                          <span>{addr.country || 'Pakistan'}</span>
                          {customerEmail(order) && (
                            <a href={`mailto:${customerEmail(order)}`} className="admin-address-email">
                              {customerEmail(order)}
                            </a>
                          )}
                        </address>
                        <div className="admin-order-flags">
                          <span className="admin-flag">{order.user ? 'Account' : 'Guest'}</span>
                          <span className="admin-flag">{order.paymentMethod || 'COD'}</span>
                          <span className="admin-flag">{order.paymentStatus || 'Pending'}</span>
                          {order.promoCode && <span className="admin-flag is-gold">{order.promoCode}</span>}
                          {order.referralCode && (
                            <span className="admin-flag is-gold">Ref: {order.referralCode}</span>
                          )}
                        </div>
                      </section>

                      <section className="admin-order-block">
                        <h4>Items</h4>
                        <ul className="admin-order-items-list">
                          {(order.items || []).map((item, i) => (
                            <li key={i}>
                              <span className="admin-item-name">
                                {item.name}
                                {(item.color || item.size) && (
                                  <em>{[item.color, item.size].filter(Boolean).join(' / ')}</em>
                                )}
                              </span>
                              <span className="admin-item-qty">×{item.quantity}</span>
                              <span className="admin-item-price">
                                Rs. {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <dl className="admin-order-totals">
                          <div><dt>Subtotal</dt><dd>Rs. {(order.totalAmount || 0).toLocaleString()}</dd></div>
                          <div><dt>Shipping</dt><dd>Rs. {(order.shippingCharges || 0).toLocaleString()}</dd></div>
                          <div><dt>Tax</dt><dd>Rs. {(order.taxAmount || 0).toLocaleString()}</dd></div>
                          {order.discountAmount > 0 && (
                            <div><dt>Discount</dt><dd>− Rs. {order.discountAmount.toLocaleString()}</dd></div>
                          )}
                          <div className="is-total">
                            <dt>Total</dt><dd>Rs. {(order.finalAmount || 0).toLocaleString()}</dd>
                          </div>
                        </dl>
                      </section>
                    </div>

                    <div className="admin-order-actions">
                      <span className="admin-order-actions-label">Update status</span>
                      <div className="admin-status-btns">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`admin-status-btn ${order.orderStatus === s ? 'is-active' : ''}`}
                            disabled={savingId === order._id || order.orderStatus === s}
                            onClick={() => handleStatusChange(order._id, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
