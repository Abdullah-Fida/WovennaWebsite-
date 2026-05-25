import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, deleteCartItem } from '../api';
import Toast from '../components/Toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InfoTip from '../components/ui/InfoTip';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setError('');
      const data = await getCart();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (productId, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(productId, { quantity: newQty });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await deleteCartItem(productId);
      setToastMsg('Item removed');
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <PageHeader
            breadcrumbs={[
              { label: 'Home', to: '/' },
              { label: 'Cart' },
            ]}
            eyebrow="Your Bag"
            title={
              <>
                Shopping <em>Cart</em>
              </>
            }
            subtitle="Your selected items will appear here. Add products from the Shop page, then come back to review quantities and proceed to checkout."
          />

          {error ? (
            <EmptyState
              title="Can’t load your cart right now"
              description={`${error}. This often happens when the backend is offline. You can still browse the informational pages and try again later.`}
              actions={
                <>
                  <button className="btn-gold" onClick={fetchCart}>
                    Try Again
                  </button>
                  <Link to="/shop" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'rgba(10,17,40,0.3)' }}>
                    Go to Shop
                  </Link>
                </>
              }
            />
          ) : (
            <EmptyState
              title="Your bag is empty"
              description="Start by exploring the collection. Open a product, read details, and add it to your bag."
              actions={
                <>
                  <Link to="/shop" className="btn-gold">
                    Discover Collection
                  </Link>
                </>
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />

        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Cart' },
          ]}
          eyebrow="Your Bag"
          title={
            <>
              Review your <em>items</em>
            </>
          }
          subtitle="Adjust quantity, remove items, and confirm your total. When ready, proceed to checkout and enter shipping details."
        />

        <div className="card card--soft card-pad" style={{ marginBottom: 26 }}>
          <div className="help-text">
            Total explanation <InfoTip tip="Subtotal is the sum of (price × quantity) for each item. Shipping is currently set as Free in the UI." ariaLabel="Total explanation" />:
            <ul className="help-list">
              <li>Subtotal = sum of all item subtotals</li>
              <li>Shipping = Free</li>
              <li>Total = Subtotal + Shipping</li>
            </ul>
          </div>
        </div>

        <div className="cart-page-grid">
          <div className="cart-items-list">
            {items.map((item) => (
              <div key={item.productId} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-unit-price">Rs. {item.price.toLocaleString()}</div>

                  <div className="cart-qty-row">
                    <div className="cart-qty-selector">
                      <button className="cart-qty-btn" onClick={() => handleUpdateQty(item.productId, item.quantity - 1)} aria-label="Decrease quantity">
                        -
                      </button>
                      <div className="cart-qty-num">{item.quantity}</div>
                      <button className="cart-qty-btn" onClick={() => handleUpdateQty(item.productId, item.quantity + 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                    <div className="cart-item-subtotal">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                  </div>

                  <button className="cart-item-remove" onClick={() => handleRemove(item.productId)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-title">Order Summary</div>
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">Rs. {total.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Shipping</span>
              <span className="summary-value" style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                Free
              </span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span className="summary-total-label">Total</span>
              <span className="summary-total-amount">Rs. {total.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
            <Link
              to="/shop"
              className="btn-ghost"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 12,
                color: 'var(--navy)',
                borderColor: 'rgba(10,17,40,0.3)',
                padding: '14px 16px',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
