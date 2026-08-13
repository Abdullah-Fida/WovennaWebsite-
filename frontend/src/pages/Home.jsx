import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts, getGalleryPosts } from '../api';
import ProductCard from '../components/ProductCard';
import SmartImage from '../components/ui/SmartImage';
import Lightbox from '../components/ui/Lightbox';
import BrandIntro from '../components/BrandIntro';

// The house lookbook. Approved influencer posts are appended to these, so the
// gallery grows without a deploy.
const HOUSE_LOOKBOOK = [
  { src: '/Images/image-6.jpeg', caption: 'Straw Crossbody' },
  { src: '/Images/image-11.jpeg', caption: 'The Top Handle' },
  { src: '/Images/image-8.jpeg', caption: 'Straw Tote' },
  { src: '/Images/image-12.jpeg', caption: 'Tailored & Woven' },
  { src: '/Images/image-5.jpeg', caption: 'Packed for Summer' },
  { src: '/Images/image-3.jpeg', caption: 'Woven Tote' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [lookbook, setLookbook] = useState(HOUSE_LOOKBOOK);
  const [lightboxIndex, setLightboxIndex] = useState(null);

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

    // Community posts sit after the house shots. A failure here is silent —
    // the curated lookbook still renders.
    getGalleryPosts()
      .then((posts) => {
        if (!posts.length) return;
        setLookbook([
          ...HOUSE_LOOKBOOK,
          ...posts.map((p) => ({
            src: p.image,
            caption: p.caption || '',
            credit: p.influencerName ? `@${p.influencerName}` : '',
            productId: p.product?._id || p.product || null,
          })),
        ]);
      })
      .catch(() => {});

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <>
      <BrandIntro />

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
            <Link to="/shop" className="btn-gold">Shop Now</Link>
          </div>
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
              <h3 className="material-name">Cotton Threads</h3>
              <p className="material-desc">Woven tight to hold shape, yet soft to the touch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LOOKBOOK — a real gallery: one tap opens the full-screen viewer. */}
      <section id="lookbook">
        <div className="lookbook-header reveal">
          <span className="section-label">Lookbook</span>
          <h2 className="section-title">Crafted with <em>Soul</em></h2>
          <p className="section-body" style={{ maxWidth: 620, margin: '0 auto' }}>
            Styled for modern life. Tap any image to view it full screen.
          </p>
        </div>

        <div className="reveal lookbook-gallery">
          {lookbook.map((shot, i) => (
            <button
              type="button"
              key={`${shot.src}-${i}`}
              className="lookbook-tile"
              onClick={() => setLightboxIndex(i)}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={`View ${shot.caption || 'lookbook image'} full screen`}
            >
              <SmartImage
                src={shot.src}
                alt={shot.caption || ''}
                fill
                width={700}
                sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
              />
              <span className="lookbook-tile-shield" aria-hidden="true" />
              {(shot.caption || shot.credit) && (
                <span className="lookbook-tile-caption">
                  {shot.caption}
                  {shot.credit && <em>{shot.credit}</em>}
                </span>
              )}
              <span className="lookbook-tile-zoom" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4.2-4.2M11 8v6M8 11h6" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </section>

      <Lightbox
        items={lookbook}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndex={setLightboxIndex}
      />

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
