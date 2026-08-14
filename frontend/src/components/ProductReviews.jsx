import { useEffect, useState } from 'react';
import { getProductReviews } from '../api';
import Stars from './ui/Stars';

const MONTH = { month: 'short', year: 'numeric' };
const initials = (name) =>
  String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const PAGE = 4;

/**
 * The reviews for one product: a summary panel with the average and a star
 * breakdown, then the reviews themselves. Renders nothing at all when the
 * product has no reviews yet — an empty "0 reviews" block reads worse than
 * no block.
 */
export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, average: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setShown(PAGE);
    getProductReviews(productId)
      .then((data) => {
        if (!live) return;
        setReviews(data.reviews);
        setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [productId]);

  if (loading || summary.count === 0) return null;

  return (
    <section className="product-reviews" id="reviews">
      <div className="product-reviews-head">
        <span className="section-label">Reviews</span>
        <h2 className="section-title">What owners <em>say</em></h2>
      </div>

      <div className="product-reviews-layout">
        <aside className="review-summary">
          <div className="review-summary-score">{summary.average.toFixed(1)}</div>
          <Stars value={summary.average} size="lg" />
          <div className="review-summary-count">
            Based on {summary.count} review{summary.count === 1 ? '' : 's'}
          </div>

          <div className="review-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = summary.distribution?.[star] || 0;
              const pct = summary.count ? (n / summary.count) * 100 : 0;
              return (
                <div key={star} className="review-bar">
                  <span className="review-bar-label">{star}★</span>
                  <span className="review-bar-track">
                    <span className="review-bar-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="review-bar-count">{n}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="review-list">
          {reviews.slice(0, shown).map((r) => (
            <article key={r._id} className="review-card">
              <div className="review-card-head">
                <span className="review-avatar" aria-hidden="true">{initials(r.name)}</span>
                <div className="review-who">
                  <span className="review-name">{r.name}</span>
                  <span className="review-sub">
                    {r.location && <>{r.location} · </>}
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString('en-GB', MONTH)
                      : null}
                  </span>
                </div>
                <Stars value={r.rating} size="sm" className="review-card-stars" />
              </div>

              {r.title && <h3 className="review-card-title">{r.title}</h3>}
              <p className="review-card-body">{r.body}</p>
            </article>
          ))}

          {shown < reviews.length && (
            <button
              type="button"
              className="btn-ghost review-more"
              style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}
              onClick={() => setShown((n) => n + PAGE)}
            >
              Show more reviews ({reviews.length - shown})
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
