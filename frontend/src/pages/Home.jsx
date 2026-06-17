import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    // Fetch featured products
    getProducts('?limit=2').then(data => setProducts(data.slice(0, 2))).catch(console.error);

    return () => observer.disconnect();
  }, []);

  // Re-observe after products load (new .reveal elements appear)
  useEffect(() => {
    if (products.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products]);

  return (
    <>
      {/* HERO — image-1 */}
      <section id="hero">
        <div className="hero-bg">
          <img src="/Images/image-1.jpeg" alt="Wovenaa woven bags" />
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

      {/* COLLECTIONS — Featured categories after hero */}
      <section id="featured-collections">
        <div className="collections-inner reveal">
          <div className="collections-header">
            <span className="section-label">Shop by Category</span>
            <h2 className="section-title">Our <em>Collections</em></h2>
            <p className="section-body" style={{ maxWidth: 580 }}>
              Curated selections for every occasion. Explore our signature styles crafted with heritage techniques and modern elegance.
            </p>
          </div>

          <div className="collections-grid">
            <Link to="/shop?category=Tote" className="collection-card collection-card--large reveal">
              <div className="collection-card-img">
                <img src="/Images/image-3.jpeg" alt="Tote Collection" />
              </div>
              <div className="collection-card-overlay">
                <span className="collection-card-label">Signature Collection</span>
                <h3 className="collection-card-title">Totes</h3>
                <span className="collection-card-cta">
                  Shop Now
                  <svg viewBox="0 0 24 24" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
              </div>
            </Link>

            <Link to="/shop?category=Crossbody" className="collection-card reveal">
              <div className="collection-card-img">
                <img src="/Images/image-4.jpeg" alt="Crossbody Collection" />
              </div>
              <div className="collection-card-overlay">
                <span className="collection-card-label">Everyday Essentials</span>
                <h3 className="collection-card-title">Crossbody</h3>
                <span className="collection-card-cta">
                  Shop Now
                  <svg viewBox="0 0 24 24" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
              </div>
            </Link>

            <Link to="/shop" className="collection-card reveal">
              <div className="collection-card-img">
                <img src="/Images/image-6.jpeg" alt="New Arrivals" />
              </div>
              <div className="collection-card-overlay">
                <span className="collection-card-label">Fresh Drops</span>
                <h3 className="collection-card-title">New Arrivals</h3>
                <span className="collection-card-cta">
                  Shop Now
                  <svg viewBox="0 0 24 24" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
              </div>
            </Link>
          </div>
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

      {/* LOOKBOOK — image-3, image-4 */}
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
            <img src="/Images/image-3.jpeg" alt="Signature Tote" />
            <figcaption className="lookbook-caption">Signature Tote</figcaption>
          </figure>
          <figure className="lookbook-item lookbook-item--b">
            <img src="/Images/image-4.jpeg" alt="Crossbody" />
            <figcaption className="lookbook-caption">Crossbody</figcaption>
          </figure>
        </div>
      </section>

      {/* COLLECTION — product cards from DB */}
      <section id="collection">
        <div className="collection-header reveal">
          <div>
            <span className="section-label">THE TIMELESS WEAVE</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>The <em>Wovenaa</em> Edit</h2>
          </div>
          <Link to="/shop" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>View All</Link>
        </div>
        
        <div className="collection-grid reveal">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* MATERIALS — image-5, image-6 */}
      <section id="materials">
        <span className="section-label reveal">The Elements</span>
        <h2 className="section-title reveal">Uncompromising <em>Quality</em></h2>
        <div className="materials-layout reveal">
          <div className="hotspot-container">
            <img src="/Images/image-5.jpeg" alt="Handbag materials close-up" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* GALLERY SHOWCASE — image-6, image-7, image-8 */}
      <section id="gallery" style={{ padding: 'clamp(60px, 10vw, 120px) clamp(20px, 5vw, 72px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }} className="reveal">
          <span className="section-label">Gallery</span>
          <h2 className="section-title">Crafted with <em>Soul</em></h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(8px, 1.5vw, 16px)',
        }} className="reveal">
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src="/Images/image-6.jpeg" alt="Wovenaa product 1" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src="/Images/image-7.jpeg" alt="Wovenaa product 2" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
          </div>
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src="/Images/image-8.jpeg" alt="Wovenaa product 3" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
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
