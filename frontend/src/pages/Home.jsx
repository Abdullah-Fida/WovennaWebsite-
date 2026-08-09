import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';



export default function Home() {
  const [products, setProducts] = useState([]);
  const [soldOutProducts, setSoldOutProducts] = useState([]);

  useEffect(() => {
    // Reveal-on-scroll. Sections start at opacity 0, so anything that never
    // gets observed stays invisible forever — a MutationObserver keeps late
    // content (products fetched after mount) from being stranded.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const observeAll = () =>
      document
        .querySelectorAll('.reveal:not(.visible)')
        .forEach((el) => io.observe(el));

    observeAll();

    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: if IntersectionObserver never fires (e.g. the element is
    // already past the fold on load), reveal everything after a beat.
    const fallback = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('visible');
      });
    }, 600);

    getProducts('isFeatured=true&limit=3')
      .then((data) => setProducts(data.slice(0, 3)))
      .catch(console.error);

    getProducts('showInSoldOutRow=true&limit=3')
      .then((data) => setSoldOutProducts(data.slice(0, 3)))
      .catch(console.error);

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <>
      {/* HERO — image-1 */}
      <section id="hero">
        <div className="hero-bg">
          <img src="/Images/FULL-ROOM.webp" alt="Wovenaa woven bags" />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-eyebrow">Est. 2026 · THE TIMELESS WEAVE</span>
          <h1 className="hero-title">Some Things Were Never<br /><em>Meant to Be Replaced</em></h1>
          <p className="hero-subtitle">Woven for the woman who buys once, and keeps forever.</p>
          <Link to="/shop" className="btn-ghost">Explore Collection</Link>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* PRODUCT CARDS — 2 rows: 3 main + 3 dummy sold out */}
      <section id="collection">
        <div className="collection-header reveal">
          <div>
            <span className="section-label">OUR PRODUCTS</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>The <em>Wovenaa</em> Edit</h2>
          </div>
          <Link to="/shop" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>View All</Link>
        </div>
        
        {/* Upper Row — 3 main products */}
        <div className="collection-grid collection-grid--3col reveal">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>


      </section>

      {/* HERITAGE — image-2 */}
      <section id="heritage">
        <div className="heritage-grid">
          <div className="heritage-image-side reveal">
            <img src="/Images/image-2.jpeg" alt="The ancient weave craft" />
            <div className="heritage-img-caption">THE ANCIENT WEAVE · EST. 2000 BC</div>
          </div>
          <div className="heritage-text-side reveal">
            <span className="section-label">ANCIENT CRAFT, MODERN STRENGTH</span>
            <h2 className="section-title">Before fast fashion existed,<br /><em>this bag already did.</em></h2>
            <div className="heritage-quote">
              "In 2000 BC, Ancient Egyptians wove reeds and grass into bags that carried their world.
              Four thousand years later, the weave is still here.
              Some things simply refuse to be replaced."
            </div>
            <p className="section-body">
              The world moves fast. Trends arrive Tuesday and disappear by Friday.
              Wovenaa was built as a quiet answer to all of that — a bag that carries a lineage older than any brand,
              any logo, or any season.
            </p>
            <Link to="/shop" className="btn-gold">Discover the Process</Link>
          </div>
        </div>
      </section>

      {/* Lower Row — sold out products from the admin panel. Hidden entirely
          until real products with images are marked for this row. */}
      {soldOutProducts.length > 0 && (
      <section style={{ padding: '0 0 clamp(64px, 10vw, 140px) 0' }}>
        <div className="collection-grid collection-grid--3col reveal">
          {soldOutProducts.map(product => (
            <div key={product._id} className="product-card grid-card product-card--sold-out">
              <div className="product-image-wrap">
                <img
                  src={product.images?.[0] || '/premium/flatlay-marble.jpg'}
                  alt={product.name}
                  className="primary"
                  onError={(e) => { e.currentTarget.src = '/premium/flatlay-marble.jpg'; }}
                />
                <div className="product-overlay product-overlay--sold-out">
                  <span className="overlay-sold-out-text">Sold Out</span>
                </div>
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
            </div>
          ))}
        </div>
      </section>
      )}

      {/* LOOKBOOK — Straw Tote (left), Crossbody (right) */}
      <section id="lookbook">
        <div className="lookbook-header reveal">
          <span className="section-label">Lookbook</span>
          <h2 className="section-title">Premium in every <em>detail</em></h2>
          <p className="section-body" style={{ maxWidth: 640 }}>
            Just two silhouettes—Tote and Crossbody—styled for modern life. Minimal. Elegant. Built to last.
          </p>
        </div>

        <div className="lookbook-grid reveal">
          <figure className="lookbook-item lookbook-item--a">
            <img src="/Images/image-1.jpeg" alt="Straw Tote" />
            <figcaption className="lookbook-caption">Straw Tote</figcaption>
          </figure>
          <figure className="lookbook-item lookbook-item--b">
            <img src="/Images/image-6.jpeg" alt="Straw Crossbody" />
            <figcaption className="lookbook-caption">Straw Crossbody</figcaption>
          </figure>
        </div>
      </section>

      {/* MATERIALS / THE ELEMENTS — Straw Crossbody */}
      <section id="materials">
        <span className="section-label reveal">The Elements</span>
        <h2 className="section-title reveal">Uncompromising <em>Quality</em></h2>
        <div className="materials-layout reveal">
          <div className="hotspot-container">
            <img src="/Images/image-2.jpeg" alt="Straw Crossbody detail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="materials-info">
            <div className="material-item">
              <div className="material-number">01</div>
              <h3 className="material-name">Vegan Leather</h3>
              <p className="material-desc">Cruelty-free, durable, and indistinguishable from the real thing.</p>
            </div>
            <div className="material-item">
              <div className="material-number">02</div>
              <h3 className="material-name">Natural Straw</h3>
              <p className="material-desc">Hand-harvested and dried to perfection for ultimate resilience.</p>
            </div>
            <div className="material-item">
              <div className="material-number">03</div>
              <h3 className="material-name">Cotton Rope</h3>
              <p className="material-desc">Woven tight to hold shape, yet soft to the touch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SHOWCASE — craft shot, Straw Tote, Woven Tote */}
      <section id="gallery" style={{ padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 72px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }} className="reveal">
          <span className="section-label">Gallery</span>
          <h2 className="section-title">Crafted with <em>Soul</em></h2>
        </div>
        <div className="reveal home-gallery-grid">
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src="/Images/image-6.jpeg" alt="Wovenaa product 1" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src="/Images/image-1.jpeg" alt="Straw Tote" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src="/Images/image-3.jpeg" alt="Woven Tote" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
        </div>
      </section>

      {/* CONCIERGE / CLIENT CARE */}
      <section id="concierge">
        <div className="concierge-inner reveal">
          <div className="concierge-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
            </svg>
          </div>
          <span className="section-label">Client Care</span>
          <h2 className="section-title">We help you choose the <em>right</em> bag</h2>
          <p className="section-body" style={{ maxWidth: 620, margin: '0 auto' }}>
            Need sizing advice, care guidance, or shipping details? We've added detailed pages (Materials, Care Guide, Shipping &amp; Returns, FAQ)
            so every part of the experience is clearly explained.
          </p>

          <div className="concierge-ctas">
            <Link to="/shop" className="btn-gold">Shop Now</Link>
            <Link to="/contact" className="whatsapp-btn">Contact Client Care</Link>
            <Link to="/faq" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>Read FAQ</Link>
          </div>
        </div>
      </section>
    </>
  );
}
