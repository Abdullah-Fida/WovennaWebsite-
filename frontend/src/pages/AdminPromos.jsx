import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav';
import { getAdminPromos, createPromo, updatePromo, deletePromo, getAdminProducts } from '../api';
import Toast from '../components/Toast';

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [fetchError, setFetchError] = useState('');

  const emptyForm = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expirationDate: '',
    minOrderAmount: '',
    usageLimit: '',
    isActive: true,
    applicableProducts: []
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchError('');
      const [promosData, productsData] = await Promise.all([
        getAdminPromos(),
        getAdminProducts()
      ]);
      setPromos(Array.isArray(promosData) ? promosData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.message || 'Failed to load promos');
      setToastMsg(err.message || 'Failed to load promos');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPromo(null);
    setForm(emptyForm);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      expirationDate: promo.expirationDate ? promo.expirationDate.slice(0, 10) : '',
      minOrderAmount: promo.minOrderAmount || '',
      usageLimit: promo.usageLimit || '',
      isActive: promo.isActive,
      applicableProducts: promo.applicableProducts || []
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expirationDate) {
      setError('Please fill in code, discount value, and expiration date');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        expirationDate: form.expirationDate,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
        applicableProducts: form.applicableProducts
      };

      if (editingPromo) {
        await updatePromo(editingPromo._id, payload);
        setSuccess('Promo updated successfully');
      } else {
        await createPromo(payload);
        setSuccess('Promo created successfully');
      }
      fetchData();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save promo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deletePromo(id);
      fetchData();
      setSuccess('Promo deleted');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = async (promo) => {
    try {
      await updatePromo(promo._id, { isActive: !promo.isActive });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProductSelection = (productId) => {
    setForm(prev => {
      const selected = prev.applicableProducts.includes(productId)
        ? prev.applicableProducts.filter(id => id !== productId)
        : [...prev.applicableProducts, productId];
      return { ...prev, applicableProducts: selected };
    });
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      <div className="admin-header">
        <h1>Promo <em>Codes</em></h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + Create Promo
        </button>
      </div>

      <AdminNav active="promos" />

      {success && <div className="promo-success-msg">{success}</div>}

      {/* The header and tabs stay put while data loads, so moving between
          admin sections never blanks the whole screen. */}
      {loading ? (
        <div className="page-loader"><div className="spinner"></div></div>
      ) : promos.length === 0 ? (
        <div className="state-panel">
          <h3>No promo codes yet</h3>
          <p>Create your first promo code to offer discounts to your customers.</p>
          <button className="btn-gold" onClick={openCreate}>Create First Promo</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Products</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => (
                <tr key={promo._id}>
                  <td>
                    <span className="promo-code-display">{promo.code}</span>
                  </td>
                  <td>
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}%`
                      : `Rs. ${promo.discountValue}`
                    }
                  </td>
                  <td>
                    {promo.applicableProducts && promo.applicableProducts.length > 0
                      ? <span className="promo-product-count">{promo.applicableProducts.length} product{promo.applicableProducts.length > 1 ? 's' : ''}</span>
                      : <span className="promo-all-products">All products</span>
                    }
                  </td>
                  <td>{promo.minOrderAmount > 0 ? `Rs. ${promo.minOrderAmount}` : '—'}</td>
                  <td>
                    {promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ' / ∞'}
                  </td>
                  <td>
                    <span className={isExpired(promo.expirationDate) ? 'promo-expired' : ''}>
                      {new Date(promo.expirationDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <button
                      className="promo-toggle-btn"
                      onClick={() => handleToggle(promo)}
                      title={promo.isActive ? 'Click to disable' : 'Click to enable'}
                    >
                      <div className={`admin-toggle-switch ${promo.isActive ? 'on' : ''}`}>
                        <div className="admin-toggle-knob"></div>
                      </div>
                    </button>
                  </td>
                  <td>
                    <div className="promo-actions">
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => openEdit(promo)}>Edit</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(promo._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="admin-modal-bg" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowModal(false)}>
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="section-title" style={{ fontSize: '24px' }}>
              {editingPromo ? 'Edit' : 'Create'} <em>Promo Code</em>
            </h2>

            {error && <div className="auth-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="checkout-form-group">
                <label>Promo Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div className="checkout-form-group">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Expiration Date</label>
                  <input
                    type="date"
                    value={form.expirationDate}
                    onChange={e => setForm({ ...form, expirationDate: e.target.value })}
                    required
                  />
                </div>
                <div className="checkout-form-group">
                  <label>Min Order Amount</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0 for no minimum"
                    min="0"
                  />
                </div>
              </div>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                </div>
                <div className="checkout-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '14px' }}>
                  <label
                    className="admin-toggle-label"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  >
                    <div className={`admin-toggle-switch ${form.isActive ? 'on' : ''}`}>
                      <div className="admin-toggle-knob"></div>
                    </div>
                    {form.isActive ? 'Active' : 'Disabled'}
                  </label>
                </div>
              </div>

              {/* Product Selection */}
              <div className="checkout-form-group">
                <label>Applicable Products <span style={{ fontSize: '10px', color: 'var(--gray)', fontWeight: 300, textTransform: 'none', letterSpacing: '0.5px' }}>(leave empty for all products)</span></label>
                <div className="promo-product-selector">
                  {products.map(product => (
                    <div
                      key={product._id}
                      className={`promo-product-chip ${form.applicableProducts.includes(product._id) ? 'selected' : ''}`}
                      onClick={() => toggleProductSelection(product._id)}
                    >
                      {product.images && product.images[0] && (
                        <img src={product.images[0]} alt="" className="promo-product-chip-img" />
                      )}
                      <span>{product.name}</span>
                      {form.applicableProducts.includes(product._id) && (
                        <svg viewBox="0 0 24 24" width="14" height="14" style={{ marginLeft: 'auto', stroke: 'var(--gold)', fill: 'none', strokeWidth: 2 }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="place-order-btn" disabled={saving} style={{ marginTop: '12px' }}>
                {saving ? (
                  <span className="btn-loading">
                    <span className="btn-spinner"></span> Saving...
                  </span>
                ) : (
                  editingPromo ? 'Update Promo' : 'Create Promo'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
