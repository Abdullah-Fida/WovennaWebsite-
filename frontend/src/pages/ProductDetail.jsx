import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, addToCart } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Accordion from '../components/ui/Accordion';
import InfoTip from '../components/ui/InfoTip';
import EmptyState from '../components/ui/EmptyState';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id);
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '/premium/model-tote-premium-new.png',
        quantity: qty
      });
      setToastMsg('Added to bag');
      // Trigger cart badge update by modifying location state slightly (or context)
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!product) {
    return (
      <div className="page">
        <div className="container">
          <EmptyState
            title="Product not found"
            description="This product may have been removed or the link is incorrect. Go back to Shop to browse the full collection."
            actions={
              <>
                <button
                  className="btn-gold"
                  onClick={() => navigate('/shop')}
                >
                  Back to Shop
                </button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      
      <div className="product-detail-images">
        <div className="main-image">
          <img src={product.images?.[activeImage] || '/premium/model-crossbody-premium-new.png'} alt={product.name} />
        </div>
        {product.images && product.images.length > 1 && (
          <div className="thumbnail-gallery">
            {product.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`${product.name} view ${idx + 1}`} 
                className={`thumbnail ${activeImage === idx ? 'active' : ''}`}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-panel">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            { label: product.name },
          ]}
        />

        <div className="product-detail-tag">{product.category}</div>
        <h1 className="product-detail-name">{product.name}</h1>
        <div className="product-detail-price">
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="price-original">Rs. {product.originalPrice.toLocaleString()}</span>
          )}
          <span className="price-current">Rs. {product.price.toLocaleString()}</span>
        </div>
        
        <p className="product-detail-desc">{product.description || 'A timeless woven piece built with unparalleled craftsmanship.'}</p>
        
        <div className="product-detail-divider"></div>

        <div className="qty-label">
          Quantity <InfoTip tip="Choose how many pieces you want to add to your bag. You can always change quantity later in the Cart page." ariaLabel="Quantity help" />
        </div>
        <div className="qty-selector">
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
          <div className="qty-num">{qty}</div>
          <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
        </div>

        <button 
          className="add-to-bag-btn" 
          onClick={handleAddToCart}
          disabled={product.stock === 0 || adding}
        >
          {adding ? (
            <span className="btn-loading"><span className="btn-spinner"></span> Adding...</span>
          ) : product.stock === 0 ? 'Sold Out' : 'Add to Bag'}
        </button>

        <div className="product-specs">
          <div className="spec-row">
            <span className="spec-label">Availability</span>
            <span className="spec-value">{product.stock > 0 ? 'In Stock' : 'Sold Out'}</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Material</span>
            <span className="spec-value">Premium Woven Blend</span>
          </div>
        </div>

        <div className="card card--soft card-pad" style={{ marginTop: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 6 }}>
            Details &amp; <em style={{ color: 'var(--gold)' }}>Care</em>
          </h3>
          <p className="help-text" style={{ marginBottom: 10 }}>
            Everything you need to know before buying—usage notes, care steps, and shipping expectations.
          </p>

          <Accordion
            defaultOpenIndex={0}
            items={[
              {
                title: 'What fits inside?',
                content:
                  'Perfect for daily essentials (phone, wallet, keys, small makeup). For structured bags, avoid overloading to keep the shape clean.',
              },
              {
                title: 'Materials & care',
                content:
                  'Keep it dry, clean gently with a soft brush (woven areas) and a damp cloth (trims). Store upright with light stuffing when not in use.',
              },
              {
                title: 'Shipping & delivery',
                content:
                  'Cash on Delivery. Orders are usually dispatched within 24–48 hours (working days). Delivery depends on city/area (commonly 2–5 working days).',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
