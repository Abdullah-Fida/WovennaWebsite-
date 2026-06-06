import { useParams, Link } from 'react-router-dom';
import InfoTip from '../components/ui/InfoTip';

export default function OrderSuccess() {
  const { id } = useParams();

  return (
    <div className="order-success-page">
      <div className="order-success-inner reveal visible">
        <div className="success-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 className="success-title">Order <em>Confirmed</em></h1>
        <div className="success-order-id">Order #{id.slice(-6).toUpperCase()}</div>
        <p className="success-body">
          Thank you for choosing Wovena. Your order has been received and is now being processed. 
          We will contact you shortly to confirm the delivery details.
        </p>
        <div className="card card--soft card-pad" style={{ margin: '0 auto 34px', maxWidth: 560 }}>
          <div className="help-text">
            What happens next <InfoTip tip="Typical flow: Processing → Shipped → Delivered. You can view live status inside My Orders." ariaLabel="What happens next" />:
            <ul className="help-list">
              <li>We confirm delivery details (phone/address)</li>
              <li>Your parcel is prepared and dispatched</li>
              <li>You pay on delivery (COD)</li>
            </ul>
            <div className="help-text" style={{ marginTop: 10 }}>
              For timelines and policy, read <Link to="/shipping-returns" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(197,160,89,0.35)' }}>Shipping &amp; Returns</Link>.
            </div>
          </div>
        </div>
        <Link to="/shop" className="btn-gold" style={{ maxWidth: '300px', width: '100%' }}>Continue Shopping</Link>
        <br />
        <Link to="/orders" className="btn-ghost" style={{ marginTop: '16px', color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)', maxWidth: '300px', width: '100%' }}>View My Orders</Link>
      </div>
    </div>
  );
}
