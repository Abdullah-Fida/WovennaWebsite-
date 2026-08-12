import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SmartImage from './ui/SmartImage';
import { variantLabel, defaultVariant, priceRange } from '../lib/variants';

export default function ProductCard({ product, priority = false }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const images = product.images || [];
  const imageUrl = images[0] || null;
  const lifestyleUrl = images[1] || null;

  const isSoldOut = product.stock === 0 || product.showInSoldOutRow;
  const { min, max } = priceRange(product);

  // Quick-add uses the first in-stock variant so the button does what it says.
  // Opening the product page is still how you pick a specific colour or size.
  const addToBag = async (e, thenCheckout) => {
    e.preventDefault();
    e.stopPropagation();

    setBusy(true);
    setNote('');
    try {
      const variant = defaultVariant(product);
      await addItem({
        productId: product._id,
        name: product.name,
        price: variant?.price ?? product.price,
        image: variant?.image || imageUrl || '',
        quantity: 1,
        color: variant?.color || '',
        size: variant?.size || '',
      });
      if (thenCheckout) {
        navigate('/checkout');
      } else {
        setNote(variant && variantLabel(variant) ? `Added — ${variantLabel(variant)}` : 'Added to bag');
        setTimeout(() => setNote(''), 2200);
      }
    } catch (err) {
      // Out of stock or a variant that needs choosing: send them to the page
      // where they can see exactly what's available.
      setNote(err.message || 'Choose options');
      setTimeout(() => navigate(`/product/${product._id}`), 700);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className={`product-card grid-card ${isSoldOut ? 'product-card--sold-out' : ''}`}
    >
      {product.stock <= 5 && product.stock > 0 && (
        <div className="product-badge product-badge--limited">Low Stock</div>
      )}

      <div className="product-image-wrap">
        <SmartImage
          src={imageUrl}
          alt={product.name}
          className="primary"
          fill
          width={700}
          priority={priority}
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        {lifestyleUrl && (
          <SmartImage
            src={lifestyleUrl}
            alt=""
            className="lifestyle"
            fill
            width={700}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        )}

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
                {busy ? 'Adding…' : note || 'Add to Cart'}
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
        <div className="product-tag-row">
          <div className="product-tag">{product.category}</div>
          {(product.tags || []).slice(0, 2).map((tag, idx) => (
            <div key={idx} className="product-tag product-tag--plain">{tag}</div>
          ))}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          {product.originalPrice > min && (
            <span className="price-original-card">Rs. {product.originalPrice.toLocaleString()}</span>
          )}
          <span className="price-current-card">
            {max > min ? `From Rs. ${min.toLocaleString()}` : `Rs. ${min.toLocaleString()}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
