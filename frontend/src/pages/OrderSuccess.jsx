import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../api';
import { useAuth } from '../context/AuthContext';

export default function OrderSuccess() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    getOrderById(id).then(setOrder).catch(() => setOrder(null));
  }, [id]);

  // Guests need the full order number to track later; the short code is only
  // a fallback while the order is still loading.
  const orderNumber = order?.orderId || `#${id.slice(-6).toUpperCase()}`;
  const email = order?.guestEmail || '';

  return (
    <div className="order-success-page">
      <div className="order-success-inner reveal visible">
        <div className="success-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 className="success-title">Order <em>Confirmed</em></h1>
        <div className="success-order-id">{orderNumber}</div>
        <p className="success-body">
          Thank you for choosing Wovenaa. Your order has been received and is now being processed.
          We will contact you shortly to confirm the delivery details.
        </p>

        {!user && (
          <div className="card card--soft card-pad success-keep-note">
            <strong>Save your order number.</strong> You checked out as a guest, so use{' '}
            <strong>{orderNumber}</strong>
            {email ? <> and <strong>{email}</strong></> : null} on the Track Order page
            to check your status any time. We’ve also emailed you a copy.
          </div>
        )}

        <div className="success-actions">
          <Link to="/shop" className="btn-gold">Continue Shopping</Link>
          <Link
            to={user ? '/orders' : `/track-order?order=${encodeURIComponent(order?.orderId || '')}&email=${encodeURIComponent(email)}`}
            className="btn-ghost"
            style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}
          >
            {user ? 'View My Orders' : 'Track This Order'}
          </Link>
        </div>
      </div>
    </div>
  );
}
