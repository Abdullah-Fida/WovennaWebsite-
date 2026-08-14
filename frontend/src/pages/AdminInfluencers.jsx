import { useEffect, useState } from 'react';
import {
  getAdminInfluencers,
  setInfluencerStatus,
  recordInfluencerPayout,
  getProgramSettings,
  updateProgramSettings,
} from '../api';
import AdminNav from '../components/admin/AdminNav';
import Toast from '../components/Toast';

const FILTERS = ['pending', 'approved', 'rejected', 'suspended', 'all'];
const money = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

// Who is allowed to apply. 'delivered' depends on someone marking orders
// Delivered, so if that isn't happening the programme silently admits nobody —
// hence the looser options.
const ELIGIBILITY = [
  {
    value: 'delivered',
    label: 'Delivered order',
    hint: 'They must have an order you have marked Delivered.',
  },
  {
    value: 'any-order',
    label: 'Any order',
    hint: 'Anyone who has placed an order, whatever its status.',
  },
  {
    value: 'open',
    label: 'Anyone signed in',
    hint: 'Any customer with an account can apply.',
  },
];

export default function AdminInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState('');
  // Per-row edits, so changing one applicant's terms never touches another's.
  const [drafts, setDrafts] = useState({});
  const [eligibility, setEligibility] = useState('delivered');

  const load = async (status = filter) => {
    setLoading(true);
    try {
      setError('');
      setInfluencers(await getAdminInfluencers(status));
    } catch (err) {
      setError(err.message || 'Could not load influencers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    getProgramSettings()
      .then((s) => setEligibility(s.influencerEligibility || 'delivered'))
      .catch(() => {});
  }, []);

  const changeEligibility = async (value) => {
    const previous = eligibility;
    setEligibility(value);
    try {
      await updateProgramSettings({ influencerEligibility: value });
      setToastMsg('Entry rule updated');
    } catch (err) {
      setEligibility(previous);
      setToastMsg(err.message || 'Could not update the rule');
    }
  };

  const draftFor = (inf) =>
    drafts[inf._id] || {
      code: inf.code || '',
      commissionRate: inf.commissionRate ?? 10,
      discountPercent: inf.discountPercent ?? 10,
      adminNote: inf.adminNote || '',
      payout: '',
    };

  const setDraft = (id, patch) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const apply = async (inf, status) => {
    const d = draftFor(inf);
    setBusyId(inf._id);
    try {
      await setInfluencerStatus(inf._id, {
        status,
        code: d.code,
        commissionRate: d.commissionRate,
        discountPercent: d.discountPercent,
        adminNote: d.adminNote,
      });
      setToastMsg(`Marked ${status}`);
      await load(filter);
    } catch (err) {
      setToastMsg(err.message || 'Could not update');
    } finally {
      setBusyId('');
    }
  };

  const pay = async (inf) => {
    const amount = Number(draftFor(inf).payout);
    if (!amount) {
      setToastMsg('Enter a payout amount');
      return;
    }
    setBusyId(inf._id);
    try {
      await recordInfluencerPayout(inf._id, amount);
      setToastMsg(`Recorded ${money(amount)}`);
      setDraft(inf._id, { payout: '' });
      await load(filter);
    } catch (err) {
      setToastMsg(err.message || 'Could not record payout');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="admin-header">
        <h1>Influencer <em>Program</em></h1>
      </div>

      <AdminNav active="influencers" />

      <section className="admin-setting card card--soft card-pad">
        <div className="admin-setting-head">
          <h3>Who can apply</h3>
          <p>
            Applicants see this rule on the programme page. If orders aren’t being marked
            Delivered, nobody can get in — loosen it here rather than leaving people stuck.
          </p>
        </div>
        <div className="admin-setting-options">
          {ELIGIBILITY.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`admin-setting-option ${eligibility === opt.value ? 'is-active' : ''}`}
              onClick={() => changeEligibility(opt.value)}
            >
              <span className="admin-setting-label">{opt.label}</span>
              <span className="admin-setting-hint">{opt.hint}</span>
            </button>
          ))}
        </div>
      </section>

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
          <h3>Could not load influencers</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={() => load(filter)}>Try Again</button>
        </div>
      ) : influencers.length === 0 ? (
        <div className="state-panel">
          <h3>Nothing here</h3>
          <p>No {filter === 'all' ? '' : filter} applications right now.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {influencers.map((inf) => {
            const isOpen = expanded === inf._id;
            const d = draftFor(inf);
            const owed = Math.max(0, (inf.stats?.earned || 0) - (inf.commissionPaid || 0));

            return (
              <div key={inf._id} className={`admin-order ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="admin-order-head"
                  onClick={() => setExpanded(isOpen ? null : inf._id)}
                  aria-expanded={isOpen}
                >
                  <div className="admin-order-id">
                    <span className="admin-order-no">{inf.handle ? `@${inf.handle}` : inf.name}</span>
                    <span className="admin-order-date">{inf.email}</span>
                  </div>
                  <div className="admin-order-cust">
                    <span className="admin-order-name">{inf.code || '— no code —'}</span>
                    <span className="admin-order-sub">
                      {(inf.followers || 0).toLocaleString()} followers
                    </span>
                  </div>
                  <div className="admin-order-meta">
                    <span className="admin-order-items">{inf.stats?.orders || 0} orders</span>
                    <span className="admin-order-total">{money(inf.stats?.revenue)}</span>
                  </div>
                  <span className={`influencer-status is-${inf.status}`}>{inf.status}</span>
                  <svg className="admin-order-caret" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="admin-order-body">
                    <div className="admin-order-cols">
                      <section className="admin-order-block">
                        <h4>Application</h4>
                        <dl className="admin-order-totals">
                          <div><dt>Name</dt><dd>{inf.name}</dd></div>
                          <div><dt>Phone</dt><dd>{inf.phone || '—'}</dd></div>
                          <div><dt>Instagram</dt><dd>{inf.instagram || '—'}</dd></div>
                          <div><dt>TikTok</dt><dd>{inf.tiktok || '—'}</dd></div>
                          <div><dt>Applied</dt><dd>{new Date(inf.createdAt).toLocaleDateString()}</dd></div>
                        </dl>
                        {inf.pitch && <p className="admin-pitch">“{inf.pitch}”</p>}
                      </section>

                      <section className="admin-order-block">
                        <h4>Earnings</h4>
                        <dl className="admin-order-totals">
                          <div><dt>Sales generated</dt><dd>{money(inf.stats?.revenue)}</dd></div>
                          <div><dt>Earned (delivered)</dt><dd>{money(inf.stats?.earned)}</dd></div>
                          <div><dt>Pending delivery</dt><dd>{money(inf.stats?.pending)}</dd></div>
                          <div><dt>Paid out</dt><dd>{money(inf.commissionPaid)}</dd></div>
                          <div className="is-total"><dt>Owed</dt><dd>{money(owed)}</dd></div>
                        </dl>

                        {inf.status === 'approved' && (
                          <div className="admin-payout-row">
                            <input
                              type="number"
                              min="0"
                              value={d.payout}
                              onChange={(e) => setDraft(inf._id, { payout: e.target.value })}
                              placeholder="Amount paid"
                            />
                            <button
                              type="button"
                              className="admin-btn admin-btn-primary"
                              disabled={busyId === inf._id || owed <= 0}
                              onClick={() => pay(inf)}
                            >
                              Record payout
                            </button>
                          </div>
                        )}
                        {inf.payoutMethod && (
                          <p className="admin-payout-detail">
                            {inf.payoutMethod} · {inf.payoutDetails}
                          </p>
                        )}
                      </section>
                    </div>

                    <div className="admin-terms-row">
                      <label>
                        <span>Code</span>
                        <input
                          type="text"
                          value={d.code}
                          disabled={Boolean(inf.code)}
                          onChange={(e) => setDraft(inf._id, { code: e.target.value.toUpperCase() })}
                          placeholder="Auto from handle"
                        />
                      </label>
                      <label>
                        <span>Commission %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={d.commissionRate}
                          onChange={(e) => setDraft(inf._id, { commissionRate: e.target.value })}
                        />
                      </label>
                      <label>
                        <span>Customer discount %</span>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={d.discountPercent}
                          onChange={(e) => setDraft(inf._id, { discountPercent: e.target.value })}
                        />
                      </label>
                      <label className="is-wide">
                        <span>Note to applicant</span>
                        <input
                          type="text"
                          value={d.adminNote}
                          onChange={(e) => setDraft(inf._id, { adminNote: e.target.value })}
                          placeholder="Shown if you reject the application"
                        />
                      </label>
                    </div>

                    <div className="admin-order-actions">
                      <span className="admin-order-actions-label">Decision</span>
                      <div className="admin-status-btns">
                        {['approved', 'pending', 'suspended', 'rejected'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`admin-status-btn ${inf.status === s ? 'is-active' : ''}`}
                            disabled={busyId === inf._id || inf.status === s}
                            onClick={() => apply(inf, s)}
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
