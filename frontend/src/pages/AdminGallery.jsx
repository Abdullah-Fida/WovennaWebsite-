import { useEffect, useState } from 'react';
import {
  getAdminGalleryPosts,
  setGalleryPostStatus,
  deleteAdminGalleryPost,
  createGalleryPost,
  reorderGalleryPosts,
  importProductImagesToGallery,
  getProducts,
} from '../api';
import AdminNav from '../components/admin/AdminNav';
import Toast from '../components/Toast';
import SmartImage from '../components/ui/SmartImage';
import SortableList from '../components/admin/SortableList';
import { compressImage } from '../lib/compress';

const TABS = [
  { key: 'live', label: 'Live on the site' },
  { key: 'pending', label: 'Awaiting review' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminGallery() {
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [linked, setLinked] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({ caption: '', product: '' });
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setError('');
      setPosts(await getAdminGalleryPosts('all'));
    } catch (err) {
      setError(err.message || 'Could not load the lookbook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const live = posts.filter((p) => p.status === 'approved');
  const pending = posts.filter((p) => p.status === 'pending');
  const rejected = posts.filter((p) => p.status === 'rejected');
  const counts = { live: live.length, pending: pending.length, rejected: rejected.length };

  const pickImage = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const ready = await compressImage(picked);
    if (preview) URL.revokeObjectURL(preview);
    setFile(ready);
    setPreview(URL.createObjectURL(ready));
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) {
      setToastMsg('Choose an image first');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('caption', caption);
      if (linked) form.append('product', linked);
      await createGalleryPost(form);
      setToastMsg('Added to the lookbook');
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview('');
      setCaption('');
      setLinked('');
      await load();
    } catch (err) {
      setToastMsg(err.message || 'Could not upload');
    } finally {
      setUploading(false);
    }
  };

  // Pulls in every product photo that isn't already here, so the lookbook
  // covers the whole catalogue without re-uploading anything.
  const importProducts = async () => {
    setImporting(true);
    try {
      const res = await importProductImagesToGallery();
      setToastMsg(res.message || 'Imported');
      await load();
    } catch (err) {
      setToastMsg(err.message || 'Could not import product photos');
    } finally {
      setImporting(false);
    }
  };

  const decide = async (post, status) => {
    setBusyId(post._id);
    try {
      await setGalleryPostStatus(post._id, { status });
      setToastMsg(status === 'approved' ? 'Now live on the site' : `Marked ${status}`);
      await load();
    } catch (err) {
      setToastMsg(err.message || 'Could not update');
    } finally {
      setBusyId('');
    }
  };

  const saveEdit = async (post) => {
    setBusyId(post._id);
    try {
      await setGalleryPostStatus(post._id, {
        caption: editDraft.caption,
        product: editDraft.product || null,
      });
      setToastMsg('Saved');
      setEditId(null);
      await load();
    } catch (err) {
      setToastMsg(err.message || 'Could not save');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (post) => {
    if (!window.confirm('Remove this image from the lookbook?')) return;
    setBusyId(post._id);
    try {
      await deleteAdminGalleryPost(post._id);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      setToastMsg('Removed');
    } catch (err) {
      setToastMsg(err.message || 'Could not remove');
    } finally {
      setBusyId('');
    }
  };

  // Live order is the order shoppers see, so persist the drag straight away.
  const handleReorder = async (nextLive) => {
    const previous = posts;
    setPosts([...nextLive, ...pending, ...rejected]);
    try {
      await reorderGalleryPosts(nextLive.map((p) => p._id));
    } catch (err) {
      setPosts(previous);
      setToastMsg(err.message || 'Could not save the new order');
    }
  };

  const shown = tab === 'live' ? live : tab === 'pending' ? pending : rejected;

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="admin-header">
        <h1>The <em>Lookbook</em></h1>
      </div>

      <AdminNav active="gallery" />

      <form className="admin-gallery-add card card--soft card-pad" onSubmit={upload}>
        <label className={`admin-gallery-drop ${preview ? 'has-image' : ''}`}>
          {preview ? <img src={preview} alt="Selected" /> : <span>Choose an image</span>}
          <input type="file" accept="image/*" onChange={pickImage} hidden />
        </label>

        <div className="admin-gallery-add-fields">
          <div className="checkout-form-group">
            <label>Title</label>
            <input
              type="text"
              maxLength={140}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Straw Tote in Natural"
            />
          </div>
          <div className="checkout-form-group">
            <label>Link to product (optional)</label>
            <select value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">No product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-gallery-add-actions">
            <button type="submit" className="btn-gold" disabled={uploading || !file}>
              {uploading ? 'Uploading…' : 'Add to Lookbook'}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={importProducts}
              disabled={importing}
              title="Adds every product photo that isn’t already in the lookbook"
            >
              {importing ? 'Importing…' : 'Import product photos'}
            </button>
          </div>
        </div>
      </form>

      <div className="admin-toolbar">
        <div className="admin-filter-row">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`admin-chip ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} <span>{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : error ? (
        <div className="state-panel">
          <h3>Could not load the lookbook</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={load}>Try Again</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="state-panel">
          <h3>{tab === 'live' ? 'The lookbook is empty' : 'Nothing here'}</h3>
          <p>
            {tab === 'live'
              ? 'Add an image above and it appears in the Lookbook section on the homepage.'
              : 'Influencer submissions waiting on you will show up here.'}
          </p>
        </div>
      ) : tab === 'live' ? (
        <SortableList
          items={live}
          onReorder={handleReorder}
          getKey={(p) => p._id}
          className="admin-lookbook-list"
          renderItem={(post) => (
            <div className="admin-lookbook-row">
              <SmartImage src={post.image} alt={post.caption} width={200} ratio="1 / 1" sizes="72px" />

              <div className="admin-lookbook-body">
                {editId === post._id ? (
                  <div className="admin-lookbook-edit">
                    <input
                      type="text"
                      data-action
                      value={editDraft.caption}
                      onChange={(e) => setEditDraft({ ...editDraft, caption: e.target.value })}
                      placeholder="Title"
                    />
                    <select
                      data-action
                      value={editDraft.product}
                      onChange={(e) => setEditDraft({ ...editDraft, product: e.target.value })}
                    >
                      <option value="">No product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <span className="admin-lookbook-title">{post.caption || <em>Untitled</em>}</span>
                    <span className="admin-lookbook-sub">
                      {post.source === 'influencer'
                        ? `by @${post.influencer?.handle || post.influencerName || 'influencer'}`
                        : 'Wovenaa'}
                      {post.product?.name ? ` · ${post.product.name}` : ''}
                    </span>
                  </>
                )}
              </div>

              <div className="admin-lookbook-actions">
                {editId === post._id ? (
                  <>
                    <button type="button" data-action className="admin-btn admin-btn-sm admin-btn-primary" disabled={busyId === post._id} onClick={() => saveEdit(post)}>Save</button>
                    <button type="button" data-action className="admin-btn admin-btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      data-action
                      className="admin-btn admin-btn-sm"
                      onClick={() => {
                        setEditId(post._id);
                        setEditDraft({
                          caption: post.caption || '',
                          product: post.product?._id || post.product || '',
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" data-action className="admin-btn admin-btn-sm" disabled={busyId === post._id} onClick={() => decide(post, 'pending')}>Hide</button>
                    <button type="button" data-action className="admin-btn admin-btn-sm is-danger" disabled={busyId === post._id} onClick={() => remove(post)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          )}
        />
      ) : (
        <div className="admin-gallery-grid">
          {shown.map((post) => (
            <div key={post._id} className={`admin-gallery-card is-${post.status}`}>
              <SmartImage src={post.image} alt={post.caption} width={600} ratio="3 / 4" sizes="(max-width: 700px) 100vw, 300px" />
              <div className="admin-gallery-body">
                <div className="admin-gallery-head">
                  <span className="admin-gallery-author">
                    {post.influencer?.handle ? `@${post.influencer.handle}` : post.influencerName || 'Wovenaa'}
                  </span>
                  <span className={`influencer-status is-${post.status}`}>{post.status}</span>
                </div>
                {post.caption && <p className="admin-gallery-caption">{post.caption}</p>}
                <p className="admin-gallery-date">{new Date(post.createdAt).toLocaleDateString()}</p>

                <div className="admin-gallery-actions">
                  <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" disabled={busyId === post._id} onClick={() => decide(post, 'approved')}>
                    Approve
                  </button>
                  {post.status !== 'rejected' && (
                    <button type="button" className="admin-btn admin-btn-sm" disabled={busyId === post._id} onClick={() => decide(post, 'rejected')}>
                      Reject
                    </button>
                  )}
                  <button type="button" className="admin-btn admin-btn-sm is-danger" disabled={busyId === post._id} onClick={() => remove(post)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
