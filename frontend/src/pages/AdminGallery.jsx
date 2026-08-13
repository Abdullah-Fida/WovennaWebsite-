import { useEffect, useState } from 'react';
import { getAdminGalleryPosts, setGalleryPostStatus, deleteAdminGalleryPost } from '../api';
import AdminNav from '../components/admin/AdminNav';
import Toast from '../components/Toast';
import SmartImage from '../components/ui/SmartImage';

const FILTERS = ['pending', 'approved', 'rejected', 'all'];

export default function AdminGallery() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [reasons, setReasons] = useState({});

  const load = async (status = filter) => {
    setLoading(true);
    try {
      setError('');
      setPosts(await getAdminGalleryPosts(status));
    } catch (err) {
      setError(err.message || 'Could not load gallery posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const decide = async (post, status) => {
    setBusyId(post._id);
    try {
      await setGalleryPostStatus(post._id, {
        status,
        rejectionReason: reasons[post._id] || '',
      });
      setToastMsg(status === 'approved' ? 'Live on the Lookbook' : `Marked ${status}`);
      await load(filter);
    } catch (err) {
      setToastMsg(err.message || 'Could not update');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (post) => {
    if (!window.confirm('Delete this post permanently?')) return;
    setBusyId(post._id);
    try {
      await deleteAdminGalleryPost(post._id);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      setToastMsg('Post deleted');
    } catch (err) {
      setToastMsg(err.message || 'Could not delete');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="admin-header">
        <h1>Lookbook <em>Submissions</em></h1>
      </div>

      <AdminNav active="gallery" />

      <div className="admin-toolbar">
        <div className="admin-filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`admin-chip ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : error ? (
        <div className="state-panel">
          <h3>Could not load submissions</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={() => load(filter)}>Try Again</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="state-panel">
          <h3>Nothing to review</h3>
          <p>Approved posts appear in the Lookbook on the homepage.</p>
        </div>
      ) : (
        <div className="admin-gallery-grid">
          {posts.map((post) => (
            <div key={post._id} className={`admin-gallery-card is-${post.status}`}>
              <SmartImage src={post.image} alt={post.caption} width={600} ratio="3 / 4" sizes="(max-width: 700px) 100vw, 300px" />

              <div className="admin-gallery-body">
                <div className="admin-gallery-head">
                  <span className="admin-gallery-author">
                    {post.influencer?.handle ? `@${post.influencer.handle}` : post.influencerName || 'Unknown'}
                  </span>
                  <span className={`influencer-status is-${post.status}`}>{post.status}</span>
                </div>

                {post.caption && <p className="admin-gallery-caption">{post.caption}</p>}
                {post.product?.name && (
                  <p className="admin-gallery-product">Links to {post.product.name}</p>
                )}
                <p className="admin-gallery-date">{new Date(post.createdAt).toLocaleDateString()}</p>

                {post.status !== 'approved' && (
                  <input
                    type="text"
                    className="admin-gallery-reason"
                    value={reasons[post._id] ?? post.rejectionReason ?? ''}
                    onChange={(e) => setReasons((r) => ({ ...r, [post._id]: e.target.value }))}
                    placeholder="Reason (shown if rejected)"
                  />
                )}

                <div className="admin-gallery-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    disabled={busyId === post._id || post.status === 'approved'}
                    onClick={() => decide(post, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm"
                    disabled={busyId === post._id || post.status === 'rejected'}
                    onClick={() => decide(post, 'rejected')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm is-danger"
                    disabled={busyId === post._id}
                    onClick={() => remove(post)}
                  >
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
