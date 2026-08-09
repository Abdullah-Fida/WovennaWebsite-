import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PLACEHOLDER_IMAGE = '/premium/flatlay-marble.jpg';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : PLACEHOLDER_IMAGE;
  const lifestyleUrl = product.images && product.images.length > 1 ? product.images[1] : null;

  const isSoldOut = product.stock === 0 || product.showInSoldOutRow;

  // Products with variants need a choice made on the detail page first.
  const needsVariantChoice =
    (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0);

  const addToBag = async (e, thenCheckout) => {
    e.preventDefault();
    e.stopPropagation();

    if (needsVariantChoice) {
      navigate(`/product/${product._id}`);
      return;
    }

    setBusy(true);
    try {
      await addItem({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: imageUrl,
        quantity: 1,
      });
      if (thenCheckout) navigate('/checkout');
    } catch (err) {
      console.error(err);
      navigate(`/product/${product._id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link to={`/product/${product._id}`} className={`product-card grid-card ${isSoldOut ? 'product-card--sold-out' : ''}`}>
      {product.stock <= 5 && product.stock > 0 && <div className="product-badge product-badge--limited">Low Stock</div>}
      
      <div className="product-image-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="primary"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
        />
        {lifestyleUrl && <img src={lifestyleUrl} alt={product.name} className="lifestyle" />}

        {isSoldOut ? (
          <div className="product-overlay product-overlay--sold-out">
            <span className="overlay-sold-out-text">Sold Out</span>
          </div>
        ) : (
          <div className="product-overlay">
            <div className="overlay-btn-group">
              <button
                className="overlay-btn overlay-btn--primary"
                onClick={(e) => addToBag(e, false)}
                disabled={busy}
              >
                {busy ? 'Adding...' : needsVariantChoice ? 'Choose Options' : 'Add to Cart'}
              </button>
              <button
                className="overlay-btn overlay-btn--secondary"
                onClick={(e) => addToBag(e, true)}
                disabled={busy}
              >
                Buy Now
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <div className="product-tag-row" style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div className="product-tag" style={{ marginBottom: 0 }}>{product.category}</div>
          {product.tags && product.tags.map((tag, idx) => (
            <div key={idx} className="product-tag" style={{ marginBottom: 0, color: 'var(--navy)', borderColor: 'var(--navy)' }}>{tag}</div>
          ))}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original-card" style={{ textDecoration: 'line-through', color: 'rgba(10,17,40,0.4)', marginRight: '8px', fontSize: '11px' }}>
              Rs. {product.originalPrice.toLocaleString()}
            </span>
          )}
          <span className="price-current-card">Rs. {product.price.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
