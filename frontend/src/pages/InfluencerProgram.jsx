import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyInfluencer, applyAsInfluencer } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Toast from '../components/Toast';

const STEPS = [
  {
    n: '01',
    title: 'Order and receive',
    body: 'The programme is for people who actually own the bags. Place an order and wait for it to arrive — once it is marked Delivered, you can apply.',
  },
  {
    n: '02',
    title: 'Apply in a minute',
    body: 'Tell us where you post and how you would style Wovenaa. We review every application by hand.',
  },
  {
    n: '03',
    title: 'Get your code and link',
    body: 'On approval you receive a personal discount code and a referral link. Your followers save; you earn on what they spend.',
  },
  {
    n: '04',
    title: 'Post, and be featured',
    body: 'Upload your favourite shot to our Lookbook. Approved images are credited to you on the homepage.',
  },
];

export default function InfluencerProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    handle: '',
    instagram: '',
    tiktok: '',
    followers: '',
    phone: '',
    pitch: '',
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getMyInfluencer()
      .then(setState)
      .catch((err) => setError(err.message || 'Could not load your status'))
      .finally(() => setLoading(false));
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await applyAsInfluencer({ ...form, followers: Number(form.followers) || 0 });
      setToastMsg('Application received — we will be in touch');
      navigate('/influencers/dashboard');
    } catch (err) {
      setError(err.message || 'Could not submit your application');
    } finally {
      setSubmitting(false);
    }
  };

  const already = state?.influencer;
  const eligible = state?.eligible;

  return (
    <div className="page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      <div className="container">
        <PageHeader
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Influencer Program' }]}
          eyebrow="Wovenaa Circle"
          title={<>Wear it. Share it. <em>Earn from it.</em></>}
          subtitle="A small, invitation-quality programme for customers who already carry Wovenaa. Earn on every order placed through your code, and see your own photography on our Lookbook."
        />

        <div className="influencer-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="influencer-step">
              <span className="influencer-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="influencer-apply card card--soft card-pad">
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : !user ? (
            <div className="influencer-gate">
              <h3>Sign in to apply</h3>
              <p>
                We match applications to your order history, so you will need to be signed in
                with the email you ordered with.
              </p>
              <div className="influencer-gate-actions">
                <Link to="/login" className="btn-gold">Sign In</Link>
                <Link to="/register" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}>
                  Create Account
                </Link>
              </div>
            </div>
          ) : already ? (
            <div className="influencer-gate">
              <h3>
                {already.status === 'approved'
                  ? 'You are in the Circle'
                  : already.status === 'rejected'
                  ? 'This application was not accepted'
                  : 'Your application is with us'}
              </h3>
              <p>
                {already.status === 'approved'
                  ? 'Your code, link and earnings are on your dashboard.'
                  : already.status === 'rejected'
                  ? already.adminNote || 'Thank you for applying. You are welcome to apply again in future.'
                  : 'We review applications by hand, usually within a few days.'}
              </p>
              <div className="influencer-gate-actions">
                <Link to="/influencers/dashboard" className="btn-gold">Open Dashboard</Link>
              </div>
            </div>
          ) : !eligible ? (
            <div className="influencer-gate">
              {state?.reason === 'awaiting-delivery' ? (
                <>
                  <h3>Almost there</h3>
                  <p>
                    Your order <strong>{state.qualifyingOrder?.orderId}</strong> is marked{' '}
                    <strong>{state.qualifyingOrder?.orderStatus}</strong>. The Circle opens as soon
                    as it is marked Delivered — we’ll do that once it reaches you.
                  </p>
                  <div className="influencer-gate-actions">
                    <Link to="/track-order" className="btn-gold">Track Your Order</Link>
                    <Link to="/contact" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}>
                      Already received it?
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3>One order away</h3>
                  <p>
                    The Circle is for customers who own a Wovenaa piece. Order anything, and this
                    page will let you apply.
                  </p>
                  <div className="influencer-gate-actions">
                    <Link to="/#collection" className="btn-gold">Shop the Collection</Link>
                    <Link to="/track-order" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}>
                      Track an Order
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="influencer-form">
              <div className="influencer-eligible">
                {state.qualifyingOrder?.orderId
                  ? `Eligible — order ${state.qualifyingOrder.orderId} qualifies you.`
                  : 'Eligible — you can apply now.'}
              </div>

              <h3>Apply to the Circle</h3>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Public handle</label>
                  <input
                    type="text"
                    value={form.handle}
                    onChange={(e) => setForm({ ...form, handle: e.target.value })}
                    placeholder="yourname"
                    required
                  />
                </div>
                <div className="checkout-form-group">
                  <label>Followers (approx.)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.followers}
                    onChange={(e) => setForm({ ...form, followers: e.target.value })}
                    placeholder="2500"
                  />
                </div>
              </div>

              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Instagram</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="instagram.com/…"
                  />
                </div>
                <div className="checkout-form-group">
                  <label>TikTok</label>
                  <input
                    type="text"
                    value={form.tiktok}
                    onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                    placeholder="tiktok.com/@…"
                  />
                </div>
              </div>

              <div className="checkout-form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="03XX XXXXXXX"
                />
              </div>

              <div className="checkout-form-group">
                <label>How would you style Wovenaa?</label>
                <textarea
                  rows="4"
                  value={form.pitch}
                  onChange={(e) => setForm({ ...form, pitch: e.target.value })}
                  placeholder="A few lines about your audience and the kind of images you'd shoot."
                />
              </div>

              {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

              <button type="submit" className="btn-gold" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit Application'}
              </button>
            </form>
          )}

          {error && !user && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
