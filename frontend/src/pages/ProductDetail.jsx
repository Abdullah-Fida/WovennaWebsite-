import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../api';
import { useCart } from '../context/CartContext';
import SmartImage from '../components/ui/SmartImage';
import {
  defaultVariant,
  findVariant,
  hasVariants,
  variantImage,
  variantList,
  variantOriginalPrice,
  variantPrice,
  variantStock,
} from '../lib/variants';
import Toast from '../components/Toast';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Accordion from '../components/ui/Accordion';
import InfoTip from '../components/ui/InfoTip';
import EmptyState from '../components/ui/EmptyState';

const FALLBACK_IMAGES = [
  '/Images/image-6.jpeg',
  '/Images/image-7.jpeg',
  '/Images/image-8.jpeg',
  '/Images/image-9.jpeg',
  '/Images/image-10.jpeg',
  '/Images/image-11.jpeg',
  '/Images/image-12.jpeg',
  '/Images/image-13.jpeg',
  '/Images/image-14.jpeg',
  '/Images/image-15.jpeg'
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id);
        setProduct(data);

        // Open on a combination that can actually be bought.
        const preferred = defaultVariant(data);
        if (preferred) {
          setSelectedColor(
            (data.colors || []).find((c) => c.name === preferred.color) ||
              (preferred.color ? { name: preferred.color, hex: '#ccc' } : null)
          );
          setSelectedSize(preferred.size || null);
        } else {
          if (data.colors?.length) setSelectedColor(data.colors[0]);
          if (data.sizes?.length) setSelectedSize(data.sizes[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const selection = { color: selectedColor?.name || '', size: selectedSize || '' };
  const currentVariant = product ? findVariant(product, selection) : null;

  const price = product ? variantPrice(product, currentVariant) : 0;
  const wasPrice = product ? variantOriginalPrice(product, currentVariant) : 0;
  const stock = product ? variantStock(product, currentVariant) : 0;

  // Gallery: the chosen variant's photo leads, then the rest of the gallery.
  const gallery = (() => {
    if (!product) return [];
    const base = product.images?.length ? product.images : FALLBACK_IMAGES.slice(0, 4);
    const hero = currentVariant?.image;
    if (!hero) return base;
    return [hero, ...base.filter((u) => u !== hero)];
  })();

  // Picking a variant with its own photo should show that photo straight away.
  useEffect(() => {
    setActiveImage(0);
  }, [currentVariant?.image, currentVariant?.color, currentVariant?.size]);

  // Which options are actually purchasable, for greying out the rest.
  const isColorAvailable = (colorName) => {
    if (!hasVariants(product)) return true;
    return variantList(product).some(
      (v) => (v.color || '') === (colorName || '') && Number(v.stock) > 0
    );
  };
  const isSizeAvailable = (sizeName) => {
    if (!hasVariants(product)) return true;
    return variantList(product).some(
      (v) =>
        (v.size || '') === (sizeName || '') &&
        (!selectedColor || (v.color || '') === (selectedColor.name || '')) &&
        Number(v.stock) > 0
    );
  };

  const addCurrentSelection = async () => {
    await addItem({
      productId: product._id,
      name: product.name,
      price,
      image: variantImage(product, currentVariant),
      quantity: qty,
      color: selection.color,
      size: selection.size
    });
  };

  const handleAddToBag = async () => {
    setAdding(true);
    try {
      await addCurrentSelection();
      setToastMsg('Added to your bag');
    } catch (err) {
      console.error(err);
      setToastMsg(err.message || 'Failed to add to bag');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setAdding(true);
    try {
      await addCurrentSelection();
      navigate('/checkout');
    } catch (err) {
      console.error(err);
      setToastMsg(err.message || 'Failed to process order');
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

  const displayImages = gallery;

  return (
    <div className="product-detail-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />

      <div className="product-detail-images">
        <div className="main-image">
          {/* Keyed on the source so switching variant swaps cleanly instead of
              blending the outgoing and incoming photo. */}
          <SmartImage
            key={displayImages[activeImage]}
            src={displayImages[activeImage]}
            alt={product.name}
            fill
            width={1200}
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
        {displayImages.length > 1 && (
          <div className="thumbnail-gallery">
            {displayImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                className={`thumbnail ${activeImage === idx ? 'active' : ''}`}
                onClick={() => setActiveImage(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-current={activeImage === idx}
              >
                <SmartImage src={img} alt="" fill width={160} sizes="90px" />
              </button>
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

        <div className="product-detail-tag-row" style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div className="product-detail-tag">{product.category}</div>
          {product.tags && product.tags.map((tag, idx) => (
            <div key={idx} className="product-detail-tag" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>{tag}</div>
          ))}
        </div>
        <h1 className="product-detail-name">{product.name}</h1>
        <div className="product-detail-price">
          {wasPrice > price && (
            <span className="price-original">Rs. {wasPrice.toLocaleString()}</span>
          )}
          <span className="price-current">Rs. {price.toLocaleString()}</span>
          {wasPrice > price && (
            <span className="price-save">Save Rs. {(wasPrice - price).toLocaleString()}</span>
          )}
        </div>
        <button className="size-guide-btn" onClick={() => setShowSizeGuide(true)} style={{ background: 'none', border: 'none', color: 'var(--navy)', opacity: 0.7, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0', marginBottom: '16px', fontFamily: 'var(--font-body)' }}>
          <svg viewBox="0 0 24 24" style={{ width: '13px', height: '13px', stroke: 'var(--gold)', fill: 'none', strokeWidth: 1.5 }}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Size Guide &amp; Dimensions
        </button>
        
        <p className="product-detail-desc">{product.description || 'A timeless woven piece built with unparalleled craftsmanship.'}</p>
        
        <div className="product-detail-divider"></div>

        <div className="qty-label">
          Quantity <InfoTip tip="Choose how many pieces you want to order. You can always change quantity later in the Cart page." ariaLabel="Quantity help" />
        </div>
        <div className="qty-selector">
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
          <div className="qty-num">{qty}</div>
          <button
            className="qty-btn"
            onClick={() => setQty(q => Math.min(stock || 1, q + 1))}
            disabled={qty >= stock}
          >+</button>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div style={{ marginBottom: '26px' }}>
            <div className="qty-label" style={{ marginBottom: '10px' }}>
              Color: <span style={{ color: 'var(--navy)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontSize: '14px', marginLeft: '6px' }}>{selectedColor?.name}</span>
            </div>
            <div className="product-swatches">
              {product.colors.map((c, i) => {
                const available = isColorAvailable(c.name);
                const isSelected = selectedColor?.name === c.name;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`product-swatch-item ${isSelected ? 'selected' : ''} ${available ? '' : 'is-unavailable'}`}
                    onClick={() => setSelectedColor(c)}
                    disabled={!available}
                    title={available ? c.name : `${c.name} — sold out`}
                    aria-pressed={isSelected}
                  >
                    <span
                      className="product-swatch-circle"
                      style={{
                        background: c.hex,
                        boxShadow: isSelected ? '0 0 0 2px var(--bg), 0 0 0 3.5px var(--gold)' : 'none',
                        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.12)'
                      }}
                    ></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.sizes && product.sizes.length > 0 && (
          <div style={{ marginBottom: '26px' }}>
            <div className="qty-label" style={{ marginBottom: '10px' }}>
              Size: <span style={{ color: 'var(--navy)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontSize: '14px', marginLeft: '6px' }}>{selectedSize}</span>
            </div>
            <div className="product-size-chips">
              {product.sizes.map((s, i) => {
                const available = isSizeAvailable(s);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`product-size-chip ${selectedSize === s ? 'selected' : ''} ${available ? '' : 'is-unavailable'}`}
                    onClick={() => setSelectedSize(s)}
                    disabled={!available}
                    title={available ? s : `${s} — sold out`}
                    aria-pressed={selectedSize === s}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          className="add-to-bag-btn"
          onClick={handleAddToBag}
          disabled={stock === 0 || adding}
        >
          {adding ? (
            <span className="btn-loading"><span className="btn-spinner"></span> Processing...</span>
          ) : stock === 0 ? 'Sold Out' : 'Add to Bag'}
        </button>

        <button
          className="buy-now-btn"
          onClick={handleBuyNow}
          disabled={stock === 0 || adding}
        >
          Buy Now
        </button>

        {stock > 0 && stock <= 5 && (
          <div className="stock-warning">Only {stock} left in stock</div>
        )}

        <div className="product-specs">
          <div className="spec-row">
            <span className="spec-label">Availability</span>
            <span className="spec-value">{stock > 0 ? 'In Stock' : 'Sold Out'}</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Material</span>
            <span className="spec-value">{product.material || 'Premium Woven Blend'}</span>
          </div>
          {product.weight && (
            <div className="spec-row">
              <span className="spec-label">Weight</span>
              <span className="spec-value">{product.weight}</span>
            </div>
          )}
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

      {showSizeGuide && (
        <div className="size-guide-overlay open" onClick={() => setShowSizeGuide(false)}>
          <div className="size-guide-modal" onClick={e => e.stopPropagation()}>
            <button className="size-guide-close" onClick={() => setShowSizeGuide(false)}>
              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="size-guide-label">Size Guide</span>
            <h3>{product.name}</h3>
            <p className="size-guide-product-name">{product.material || 'Eco-friendly Jute Straw & Vegan Leather'}</p>

            <div className="dimension-visual">
              <div className="dim-bag">
                <div className="dim-handle-left"></div>
                <div className="dim-handle-right"></div>
                <div className="dim-bag-shape"></div>
                
                <div className="dim-width-arrow">
                  <div className="dim-arrow-tip-left"></div>
                  <div className="dim-arrow-line"></div>
                  <div className="dim-arrow-tip-right"></div>
                  <div className="dim-width-label">{product.widthCm || '19'} cm</div>
                </div>

                <div className="dim-height-arrow">
                  <div className="dim-arrow-tip-up"></div>
                  <div className="dim-height-line"></div>
                  <div className="dim-arrow-tip-down"></div>
                  <div className="dim-height-label">{product.heightCm || '19'} cm</div>
                </div>
              </div>
            </div>

            <div className="size-guide-specs">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(197,160,89,0.15)' }}>
                <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', textTransform: 'uppercase' }}>Dimensions</span>
                <span style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 300 }}>{product.dimensions || '19 cm × 8 cm × 19 cm'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(197,160,89,0.15)' }}>
                <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', textTransform: 'uppercase' }}>Material</span>
                <span style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 300 }}>{product.material || 'Eco-friendly Jute Straw & Vegan Leather'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(197,160,89,0.15)' }}>
                <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', textTransform: 'uppercase' }}>Care</span>
                <span style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 300, textAlign: 'right', maxWidth: '200px' }}>{product.careInstructions || 'Wipe with dry cloth. Keep away from water.'}</span>
              </div>
            </div>

            <p style={{ marginTop: '24px', fontSize: '10px', color: 'var(--gray)', fontStyle: 'italic', background: 'rgba(197,160,89,0.1)', padding: '12px' }}>
              All measurements are approximate. Natural materials may show slight variation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
