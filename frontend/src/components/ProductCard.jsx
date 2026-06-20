import { Link, useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  // Only show images that are actually added via backend
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const lifestyleUrl = product.images && product.images.length > 1 ? product.images[1] : null;

  // Only render if we have at least one image
  if (!imageUrl) return null;

  const isSoldOut = product.stock === 0 || product.showInSoldOutRow;

  const handleAction = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  return (
    <Link to={`/product/${product._id}`} className={`product-card grid-card ${isSoldOut ? 'product-card--sold-out' : ''}`}>
      {product.stock <= 5 && product.stock > 0 && <div className="product-badge product-badge--limited">Low Stock</div>}
      
      <div className="product-image-wrap">
        <img src={imageUrl} alt={product.name} className="primary" />
        {lifestyleUrl && <img src={lifestyleUrl} alt={product.name} className="lifestyle" />}
        
        {isSoldOut ? (
          <div className="product-overlay product-overlay--sold-out">
            <span className="overlay-sold-out-text">Sold Out</span>
          </div>
        ) : (
          <div className="product-overlay">
            <div className="overlay-btn-group">
              <button className="overlay-btn overlay-btn--primary" onClick={(e) => handleAction(e, `/product/${product._id}`)}>Add to Cart</button>
              <button className="overlay-btn overlay-btn--secondary" onClick={(e) => handleAction(e, `/checkout`)}>Buy Now</button>
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
