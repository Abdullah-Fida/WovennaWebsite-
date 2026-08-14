import { useEffect, useState } from 'react';
import {
  getAdminReviews,
  createReview,
  updateReview,
  deleteReview,
  reorderReviews,
  getProducts,
} from '../api';
import AdminNav from '../components/admin/AdminNav';
import Toast from '../components/Toast';
import SortableList from '../components/admin/SortableList';

const blank = {
  name: '',
  location: '',
  rating: 5,
  title: '',
  body: '',
  product: '',
  isPublished: true,
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setError('');
      setReviews(await getAdminReviews());
    } catch (err) {
      setError(err.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ ...blank });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r._id);
    setForm({
      name: r.name || '',
      location: r.location || '',
      rating: r.rating || 5,
      title: r.title || '',
      body: r.body || '',
      product: r.product?._id || r.product || '',
      isPublished: r.isPublished !== false,
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, product: form.product || null };
      if (editId) await updateReview(editId, payload);
      else await createReview(payload);
      setToastMsg(editId ? 'Review updated' : 'Review added');
      setShowForm(false);
      await load();
    } catch (err) {
      setToastMsg(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete the review from ${r.name}?`)) return;
    try {
      await deleteReview(r._id);
      setReviews((prev) => prev.filter((x) => x._id !== r._id));
      setToastMsg('Review deleted');
    } catch (err) {
      setToastMsg(err.message || 'Could not delete');
    }
  };

  const togglePublished = async (r) => {
    try {
      await updateReview(r._id, { isPublished: !r.isPublished });
      setReviews((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, isPublished: !x.isPublished } : x))
      );
    } catch (err) {
      setToastMsg(err.message || 'Could not update');
    }
  };

  // Order is what the homepage renders, so persist the drag immediately.
  const handleReorder = async (next) => {
    const previous = reviews;
    setReviews(next);
    try {
      await reorderReviews(next.map((r) => r._id));
    } catch (err) {
      setReviews(previous);
      setToastMsg(err.message || 'Could not save the new order');
    }
  };

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="admin-header">
        <h1>Reviews &amp; <em>Testimonials</em></h1>
        <button className="btn-gold" onClick={openNew}>+ Add Review</button>
      </div>

      <AdminNav active="reviews" />

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : error ? (
        <div className="state-panel">
          <h3>Could not load reviews</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={load}>Try Again</button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="state-panel">
          <h3>No reviews yet</h3>
          <p>Add one and it appears in the testimonials section on the homepage.</p>
          <button className="btn-gold" onClick={openNew}>Add the first review</button>
        </div>
      ) : (
        <SortableList
          items={reviews}
          onReorder={handleReorder}
          getKey={(r) => r._id}
          className="admin-review-list"
          renderItem={(r) => (
            <div className={`admin-review ${r.isPublished ? '' : 'is-hidden'}`}>
              <div className="admin-review-main">
                <div className="admin-review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < r.rating ? 'is-on' : ''}>★</span>
                  ))}
                </div>
                {r.title && <div className="admin-review-title">{r.title}</div>}
                <p className="admin-review-body">{r.body}</p>
                <div className="admin-review-meta">
                  <strong>{r.name}</strong>
                  {r.location && <span>{r.location}</span>}
                  {r.product?.name && <em>{r.product.name}</em>}
                </div>
              </div>

              <div className="admin-review-actions">
                <button type="button" data-action className="admin-btn admin-btn-sm" onClick={() => togglePublished(r)}>
                  {r.isPublished ? 'Hide' : 'Publish'}
                </button>
                <button type="button" data-action className="admin-btn admin-btn-sm" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" data-action className="admin-btn admin-btn-sm is-danger" onClick={() => remove(r)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editId ? 'Edit' : 'Add'} <em>Review</em></h2>
              <button type="button" className="admin-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <form onSubmit={save} className="admin-form">
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Customer name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="checkout-form-group">
                  <label>City (optional)</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Lahore"
                  />
                </div>
              </div>

              <div className="checkout-form-group">
                <label>Rating</label>
                <div className="admin-rating-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n <= form.rating ? 'is-on' : ''}
                      onClick={() => setForm({ ...form, rating: n })}
                      aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="checkout-form-group">
                <label>Headline (optional)</label>
                <input
                  type="text"
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Worth every rupee"
                />
              </div>

              <div className="checkout-form-group">
                <label>Review</label>
                <textarea
                  rows="4"
                  maxLength={1000}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label>Product (optional)</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                >
                  <option value="">No product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <label className="admin-toggle">
                <span
                  className={`admin-toggle-switch ${form.isPublished ? 'on' : ''}`}
                  onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                >
                  <span className="admin-toggle-knob"></span>
                </span>
                <span>Show on the homepage</span>
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
