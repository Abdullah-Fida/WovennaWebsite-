import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyInfluencer,
  getMyInfluencerOrders,
  getMyGalleryPosts,
  createMyGalleryPost,
  deleteMyGalleryPost,
  updateMyInfluencer,
  getProducts,
} from '../api';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/Toast';
import SmartImage from '../components/ui/SmartImage';
import { compressImage } from '../lib/compress';

const money = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

export default function InfluencerDashboard() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [linkedProduct, setLinkedProduct] = useState('');
  const [uploading, setUploading] = useState(false);

  const [payout, setPayout] = useState({ payoutMethod: '', payoutDetails: '' });
  const [savingPayout, setSavingPayout] = useState(false);

  const influencer = data?.influencer;
  const approved = influencer?.status === 'approved';

  useEffect(() => {
    getMyInfluencer()
      .then((res) => {
        setData(res);
        if (res.influencer) {
          setPayout({
            payoutMethod: res.influencer.payoutMethod || '',
            payoutDetails: res.influencer.payoutDetails || '',
          });
        }
        if (res.influencer?.status === 'approved') {
          getMyInfluencerOrders().then(setOrders).catch(() => {});
          getMyGalleryPosts().then(setPosts).catch(() => {});
          getProducts().then(setProducts).catch(() => {});
        }
      })
      .catch((err) => setError(err.message || 'Could not load your dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const referralLink = influencer?.code
    ? `${window.location.origin}/shop?ref=${influencer.code}`
    : '';

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMsg(`${label} copied`);
    } catch {
      setToastMsg('Could not copy — select the text instead');
    }
  };

  const pickImage = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const ready = await compressImage(picked);
    if (preview) URL.revokeObjectURL(preview);
    setFile(ready);
    setPreview(URL.createObjectURL(ready));
  };

  const submitPost = async (e) => {
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
      if (linkedProduct) form.append('product', linkedProduct);

      await createMyGalleryPost(form);
      setToastMsg('Sent for review');
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview('');
      setCaption('');
      setLinkedProduct('');
      setPosts(await getMyGalleryPosts());
    } catch (err) {
      setToastMsg(err.message || 'Could not upload');
    } finally {
      setUploading(false);
    }
  };

  const removePost = async (id) => {
    if (!window.confirm('Remove this post?')) return;
    try {
      await deleteMyGalleryPost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      setToastMsg('Post removed');
    } catch (err) {
      setToastMsg(err.message || 'Could not remove post');
    }
  };

  const savePayout = async (e) => {
    e.preventDefault();
    setSavingPayout(true);
    try {
      const res = await updateMyInfluencer(payout);
      setData((prev) => ({ ...prev, influencer: res.influencer }));
      setToastMsg('Payout details saved');
    } catch (err) {
      setToastMsg(err.message || 'Could not save');
    } finally {
      setSavingPayout(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  if (!influencer) {
    return (
      <div className="page">
        <div className="container">
          <PageHeader
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Influencer' }]}
            eyebrow="Wovenaa Circle"
            title={<>Not a <em>member</em> yet</>}
            subtitle={error || 'You have not applied to the Influencer Program.'}
          />
          <Link to="/influencers" className="btn-gold">See the Programme</Link>
        </div>
      </div>
    );
  }

  const stats = influencer.stats || {};
  const outstanding = Math.max(0, (stats.earned || 0) - (influencer.commissionPaid || 0));

  return (
    <div className="page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      <div className="container">
        <PageHeader
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Influencer' }]}
          eyebrow="Wovenaa Circle"
          title={<>Your <em>dashboard</em></>}
          right={<span className={`influencer-status is-${influencer.status}`}>{influencer.status}</span>}
        />

        {!approved ? (
          <div className="card card--soft card-pad influencer-gate">
            <h3>
              {influencer.status === 'rejected'
                ? 'This application was not accepted'
                : 'Your application is being reviewed'}
            </h3>
            <p>
              {influencer.status === 'rejected'
                ? influencer.adminNote || 'Thank you for applying — you are welcome to apply again in future.'
                : 'We look at every application by hand. Once you are approved, your code, link and earnings appear here.'}
            </p>
            <Link to="/shop" className="btn-gold">Back to Shop</Link>
          </div>
        ) : (
          <>
            <div className="influencer-stat-grid">
              <div className="stat-card">
                <div className="stat-card-label">Orders</div>
                <div className="stat-card-value">{stats.orders || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Sales generated</div>
                <div className="stat-card-value">{money(stats.revenue)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Earned (delivered)</div>
                <div className="stat-card-value gold">{money(stats.earned)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Awaiting delivery</div>
                <div className="stat-card-value">{money(stats.pending)}</div>
              </div>
            </div>

            <div className="influencer-code-card card card--soft card-pad">
              <div className="influencer-code-row">
                <div>
                  <span className="influencer-code-label">Your code</span>
                  <div className="influencer-code">{influencer.code}</div>
                  <p className="influencer-code-note">
                    Gives your followers {influencer.discountPercent}% off. You earn{' '}
                    {influencer.commissionRate}% of what they spend.
                  </p>
                </div>
                <button type="button" className="btn-ghost influencer-copy" onClick={() => copy(influencer.code, 'Code')}>
                  Copy code
                </button>
              </div>

              <div className="influencer-link-row">
                <input readOnly value={referralLink} aria-label="Referral link" />
                <button type="button" className="btn-gold" onClick={() => copy(referralLink, 'Link')}>
                  Copy link
                </button>
              </div>

              <div className="influencer-paid-row">
                <span>Paid out so far: <strong>{money(influencer.commissionPaid)}</strong></span>
                <span>Owed to you: <strong className="is-gold">{money(outstanding)}</strong></span>
              </div>
            </div>

            <div className="influencer-columns">
              <section className="card card--soft card-pad">
                <h3 className="influencer-section-title">Add to the Lookbook</h3>
                <p className="influencer-section-sub">
                  One image per post. We review before it goes live, and credit you underneath.
                </p>

                <form onSubmit={submitPost}>
                  <label className={`influencer-drop ${preview ? 'has-image' : ''}`}>
                    {preview ? (
                      <img src={preview} alt="Selected" />
                    ) : (
                      <span>Choose an image</span>
                    )}
                    <input type="file" accept="image/*" onChange={pickImage} hidden />
                  </label>

                  <div className="checkout-form-group">
                    <label>Caption</label>
                    <input
                      type="text"
                      maxLength={140}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Styled for a Karachi evening"
                    />
                  </div>

                  <div className="checkout-form-group">
                    <label>Link a product (optional)</label>
                    <select value={linkedProduct} onChange={(e) => setLinkedProduct(e.target.value)}>
                      <option value="">No product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn-gold" disabled={uploading || !file}>
                    {uploading ? 'Uploading…' : 'Submit for Review'}
                  </button>
                </form>

                {posts.length > 0 && (
                  <div className="influencer-posts">
                    {posts.map((p) => (
                      <div key={p._id} className={`influencer-post is-${p.status}`}>
                        <SmartImage src={p.image} alt={p.caption} width={260} sizes="120px" ratio="1 / 1" />
                        <div className="influencer-post-meta">
                          <span className={`influencer-post-status is-${p.status}`}>{p.status}</span>
                          {p.caption && <span className="influencer-post-caption">{p.caption}</span>}
                          {p.status === 'rejected' && p.rejectionReason && (
                            <span className="influencer-post-reason">{p.rejectionReason}</span>
                          )}
                        </div>
                        <button type="button" onClick={() => removePost(p._id)} aria-label="Remove post">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card card--soft card-pad">
                <h3 className="influencer-section-title">Payout details</h3>
                <form onSubmit={savePayout}>
                  <div className="checkout-form-group">
                    <label>Method</label>
                    <input
                      type="text"
                      value={payout.payoutMethod}
                      onChange={(e) => setPayout({ ...payout, payoutMethod: e.target.value })}
                      placeholder="Easypaisa / JazzCash / Bank"
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label>Account</label>
                    <input
                      type="text"
                      value={payout.payoutDetails}
                      onChange={(e) => setPayout({ ...payout, payoutDetails: e.target.value })}
                      placeholder="Account title and number"
                    />
                  </div>
                  <button type="submit" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }} disabled={savingPayout}>
                    {savingPayout ? 'Saving…' : 'Save Details'}
                  </button>
                </form>

                <h3 className="influencer-section-title" style={{ marginTop: 34 }}>Your orders</h3>
                {orders.length === 0 ? (
                  <p className="influencer-section-sub">
                    Nothing yet. Share your link and orders will show up here.
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr><th>Order</th><th>Date</th><th>Status</th><th>You earn</th></tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o._id}>
                            <td>{o.orderId}</td>
                            <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`order-status-badge ${(o.orderStatus || '').toLowerCase()}`}>
                                {o.orderStatus}
                              </span>
                            </td>
                            <td>{money(o.commissionAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
