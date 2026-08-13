/**
 * Referral attribution.
 *
 * An influencer's link carries `?ref=CODE`. We remember it locally so credit
 * survives the shopper browsing around, closing the tab, and coming back a few
 * days later — but not forever, or an old link would keep claiming orders it
 * had nothing to do with.
 */

const KEY = 'wovenaa_ref';
const TTL_DAYS = 30;

export function captureReferral(search) {
  const params = new URLSearchParams(search || window.location.search);
  const code = (params.get('ref') || '').trim().toUpperCase();
  if (!code) return null;

  try {
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    // Private mode with storage disabled — attribution is best effort.
  }
  return code;
}

export function getReferral() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw);
    if (!code) return null;
    if (Date.now() - at > TTL_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
