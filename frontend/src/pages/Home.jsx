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

  return (
    <>
      {/* HERO */}
      <section id="hero">
        <div className="hero-bg"><img src="/Images/FULL-ROOM.webp" alt="Premium handbag hero" /></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-eyebrow">Premium Handbags</span>
          <h1 className="hero-title">Tote &amp; Crossbody,<br /><em>Elevated</em> Everyday</h1>
          <p className="hero-subtitle">Two signature silhouettes—crafted to feel timeless, polished, and effortless.</p>
          <Link to="/shop" className="btn-ghost">Explore Collection</Link>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* HERITAGE */}
      <section id="heritage">
        <div className="heritage-grid">
          <div className="heritage-image-side reveal">
            <img src="/premium/craftsmanship.jpg" alt="Handbag craftsmanship" />
            <div className="heritage-img-caption">Hand-finished craftsmanship</div>
          </div>
          <div className="heritage-text-side reveal">
            <span className="section-label">Our Legacy</span>
            <h2 className="section-title">Rooted in <em>History</em></h2>
            <p className="section-body">Every Wovena bag carries the weight of a 4,000-year-old craft. We haven’t reinvented weaving; we’ve simply honored it, bringing the resilience of ancient techniques into modern luxury.</p>
            <div className="heritage-quote">"True luxury is not about excess. It is about permanence."</div>
            <Link to="/shop" className="btn-gold">View Collection</Link>
          </div>
        </div>
      </section>

      {/* LOOKBOOK */}
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
            <img src="/Images/model-f-1.png" alt="Model holding a tote bag" />
            <figcaption className="lookbook-caption">Signature Tote</figcaption>
          </figure>
          <figure className="lookbook-item lookbook-item--b">
            <img src="/Images/model-f-2.png" alt="Model wearing a crossbody bag" />
            <figcaption className="lookbook-caption">Crossbody</figcaption>
          </figure>
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection">
        <div className="collection-header reveal">
          <div>
            <span className="section-label">Curated Selection</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>The <em>Signatures</em></h2>
          </div>
          <Link to="/shop" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>View All</Link>
        </div>
        
        <div className="collection-grid reveal">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* MATERIALS */}
      <section id="materials">
        <span className="section-label reveal">The Elements</span>
        <h2 className="section-title reveal">Uncompromising <em>Quality</em></h2>
        <div className="materials-layout reveal">
          <div className="hotspot-container">
            <img src="/Images/close-up.png" alt="Handbag materials close-up" />
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
            Need sizing advice, care guidance, or shipping details? We’ve added detailed pages (Materials, Care Guide, Shipping &amp; Returns, FAQ)
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
