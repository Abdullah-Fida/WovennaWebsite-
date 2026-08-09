// Guests have no account to attach orders to, so we keep a lightweight receipt
// in localStorage. It lets them reopen recent orders from this browser; the
// authoritative lookup is always the server (order number + email).

const KEY = 'wovenaa_guest_orders';
const MAX = 20;

export function getGuestOrders() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberGuestOrder(order, email) {
  if (!order?._id) return;
  const entry = {
    _id: order._id,
    orderId: order.orderId,
    email: email || order.guestEmail || '',
    total: order.finalAmount,
    placedAt: order.createdAt || new Date().toISOString(),
    itemCount: (order.items || []).reduce((n, i) => n + (i.quantity || 0), 0),
  };

  const existing = getGuestOrders().filter((o) => o._id !== entry._id);
  const next = [entry, ...existing].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — tracking by email still works */
  }
}
