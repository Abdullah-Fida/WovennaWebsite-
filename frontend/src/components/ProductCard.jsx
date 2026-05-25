import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  // Only show images that are actually added via backend
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const lifestyleUrl = product.images && product.images.length > 1 ? product.images[1] : null;

  // Only render if we have at least one image
  if (!imageUrl) return null;

  return (
    <Link to={`/product/${product._id}`} className="product-card grid-card">
      {product.stock <= 5 && product.stock > 0 && <div className="product-badge product-badge--limited">Low Stock</div>}
      {product.stock === 0 && <div className="product-badge product-badge--new">Out of Stock</div>}
      
      <div className="product-image-wrap">
        <img src={imageUrl} alt={product.name} className="primary" />
        {lifestyleUrl && <img src={lifestyleUrl} alt={product.name} className="lifestyle" />}
        <div className="product-overlay">
          <button className="overlay-view">View Details</button>
        </div>
      </div>
      
      <div className="product-info">
        <div className="product-tag">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">Rs. {product.price.toLocaleString()}</div>
      </div>
    </Link>
  );
}
