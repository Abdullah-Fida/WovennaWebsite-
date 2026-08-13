import { Link } from 'react-router-dom';
import SmartImage from './ui/SmartImage';
import { priceRange } from '../lib/variants';

export default function ProductCard({ product, priority = false }) {
  const images = product.images || [];
  const imageUrl = images[0] || null;
  const lifestyleUrl = images[1] || null;

  const isSoldOut = product.stock === 0 || product.showInSoldOutRow;
  const { min, max } = priceRange(product);

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
          /* One honest label. Colour, size and quantity all live on the
             product page, so that is where the card sends you. */
          <div className="product-overlay">
            <span className="overlay-btn overlay-btn--primary">View Details</span>
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
