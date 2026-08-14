import { useEffect, useMemo, useState } from 'react';
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
import Stars from '../components/ui/Stars';

const blank = {
  name: '',
  location: '',
  rating: 5,
  title: '',
  body: '',
  product: '',
  isPublished: true,
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Live' },
  { key: 'hidden', label: 'Hidden' },
];

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

  const [tab, setTab] = useState('all');
  const [productFilter, setProductFilter] = useState('');
  const [query, setQuery] = useState('');

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
    setForm({ ...blank, product: productFilter || '' });
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
    const next = !r.isPublished;
    setReviews((prev) => prev.map((x) => (x._id === r._id ? { ...x, isPublished: next } : x)));
    try {
      await updateReview(r._id, { isPublished: next });
      setToastMsg(next ? 'Now showing on the site' : 'Hidden from the site');
    } catch (err) {
      setReviews((prev) => prev.map((x) => (x._id === r._id ? { ...x, isPublished: !next } : x)));
      setToastMsg(err.message || 'Could not update');
    }
  };

  // Order is what shoppers see, so persist the drag immediately.
  const handleReorder = async (nextVisible) => {
    const previous = reviews;
    // Only the filtered subset is draggable; splice it back into the full list
    // so hidden rows keep their place rather than being dropped.
    const ids = new Set(nextVisible.map((r) => r._id));
    let cursor = 0;
    const merged = reviews.map((r) => (ids.has(r._id) ? nextVisible[cursor++] : r));
    setReviews(merged);
    try {
      await reorderReviews(merged.map((r) => r._id));
    } catch (err) {
      setReviews(previous);
      setToastMsg(err.message || 'Could not save the new order');
    }
  };

  const stats = useMemo(() => {
    const published = reviews.filter((r) => r.isPublished !== false);
    const total = published.reduce((sum, r) => sum + (r.rating || 0), 0);
    return {
      all: reviews.length,
      published: published.length,
      hidden: reviews.length - published.length,
      average: published.length ? total / published.length : 0,
    };
  }, [reviews]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (tab === 'published' && r.isPublished === false) return false;
      if (tab === 'hidden' && r.isPublished !== false) return false;
      if (productFilter) {
        const pid = r.product?._id || r.product || '';
        if (String(pid) !== productFilter) return false;
      }
      if (!q) return true;
      return [r.name, r.location, r.title, r.body, r.product?.name]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [reviews, tab, productFilter, query]);

  const isFiltered = tab !== 'all' || Boolean(productFilter) || Boolean(query.trim());

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
          <p>
            Add one and it appears on the homepage. Attach it to a product and it also shows
            on that product’s page, with the stars on its card.
          </p>
          <button className="btn-gold" onClick={openNew}>Add the first review</button>
        </div>
      ) : (
        <>
          <div className="review-stat-row">
            <div className="stat-card">
              <div className="stat-card-label">Average rating</div>
              <div className="stat-card-value gold">{stats.average.toFixed(1)}</div>
              <Stars value={stats.average} size="sm" />
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Live on the site</div>
              <div className="stat-card-value">{stats.published}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Hidden</div>
              <div className="stat-card-value">{stats.hidden}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Total</div>
              <div className="stat-card-value">{stats.all}</div>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-filter-row">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`admin-chip ${tab === t.key ? 'is-active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label} <span>{stats[t.key === 'all' ? 'all' : t.key]}</span>
                </button>
              ))}
            </div>

            <div className="admin-toolbar-right">
              <select
                className="admin-select"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                aria-label="Filter by product"
              >
                <option value="">Every product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <input
                className="admin-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or text…"
                aria-label="Search reviews"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="state-panel">
              <h3>Nothing matches</h3>
              <p>Try a different filter or clear the search.</p>
            </div>
          ) : (
            <>
              {isFiltered && (
                <p className="admin-image-hint">
                  Showing {visible.length} of {reviews.length}. Clear the filters to drag the
                  full running order.
                </p>
              )}

              <SortableList
                items={visible}
                onReorder={handleReorder}
                getKey={(r) => r._id}
                className="admin-review-list"
                renderItem={(r) => (
                  <div className={`admin-review ${r.isPublished === false ? 'is-hidden' : ''}`}>
                    <div className="admin-review-main">
                      <div className="admin-review-top">
                        <Stars value={r.rating} size="sm" />
                        <span className={`admin-review-state ${r.isPublished === false ? 'is-off' : ''}`}>
                          {r.isPublished === false ? 'Hidden' : 'Live'}
                        </span>
                      </div>

                      {r.title && <div className="admin-review-title">{r.title}</div>}
                      <p className="admin-review-body">{r.body}</p>

                      <div className="admin-review-meta">
                        <strong>{r.name}</strong>
                        {r.location && <span>{r.location}</span>}
                        {r.product?.name ? (
                          <em>{r.product.name}</em>
                        ) : (
                          <em className="is-muted">Homepage only</em>
                        )}
                        {r.createdAt && (
                          <span>{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                        )}
                      </div>
                    </div>

                    <div className="admin-review-actions">
                      <button type="button" data-action className="admin-btn admin-btn-sm" onClick={() => togglePublished(r)}>
                        {r.isPublished === false ? 'Publish' : 'Hide'}
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
            </>
          )}
        </>
      )}

      {showForm && (
        <div className="admin-modal-bg" onClick={() => setShowForm(false)}>
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
                  <span className="admin-rating-value">{form.rating}.0</span>
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
                <label>
                  Review
                  <span className="admin-char-count">{form.body.length}/1000</span>
                </label>
                <textarea
                  rows="5"
                  maxLength={1000}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label>Product</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                >
                  <option value="">Homepage only — not tied to a product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <p className="admin-field-note">
                  Choosing a product puts this review on that product’s page and counts it
                  towards the stars on its card.
                </p>
              </div>

              <label className="admin-toggle">
                <span
                  className={`admin-toggle-switch ${form.isPublished ? 'on' : ''}`}
                  onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                >
                  <span className="admin-toggle-knob"></span>
                </span>
                <span>Show on the site</span>
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
