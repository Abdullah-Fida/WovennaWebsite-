import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts, getGalleryPosts, getReviews } from '../api';
import ProductCard from '../components/ProductCard';
import SmartImage from '../components/ui/SmartImage';
import Lightbox from '../components/ui/Lightbox';
import BrandIntro from '../components/BrandIntro';
import Stars from '../components/ui/Stars';

// The homepage shows a short, curated edit rather than the whole catalogue —
// the full range lives on the Shop page.
const EDIT_SIZE = 3;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [lookbook, setLookbook] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [reviews, setReviews] = useState([]);

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
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));

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

    // Featured first, in the order set in the admin panel. If nothing has been
    // marked featured yet, fall back to the top of the collection so the
    // homepage is never empty.
    getProducts(`isFeatured=true&limit=${EDIT_SIZE}`)
      .then((featured) =>
        featured.length ? featured : getProducts(`limit=${EDIT_SIZE}`)
      )
      .then((list) => setProducts(list.slice(0, EDIT_SIZE)))
      .catch(console.error);

    // Lookbook and testimonials are both admin-managed, so a failure here
    // just means the section stays hidden rather than showing stale copy.
    getGalleryPosts()
      .then((posts) =>
        setLookbook(
          posts.map((p) => ({
            src: p.image,
            caption: p.caption || '',
            credit: p.source === 'influencer' && p.influencerName ? `@${p.influencerName}` : '',
            productId: p.product?._id || p.product || null,
          }))
        )
      )
      .catch(() => {});

    getReviews().then(setReviews).catch(() => {});

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <>
      <BrandIntro />

      {/* HERO — the photograph, nothing else. */}
      <section id="hero">
        <div className="hero-bg">
          <img
            src="/Images/FULL-ROOM.webp"
            alt="Wovenaa woven bags"
            fetchpriority="high"
            decoding="async"
          />
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* THE EDIT — a short curated row; the full range lives on /shop. */}
      <section id="collection">
        <div className="collection-header reveal">
          <div>
            <span className="section-label">Our Products</span>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              The <em>Wovenaa</em> Edit
            </h2>
          </div>
          <Link
            to="/shop"
            className="btn-ghost"
            style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}
          >
            View All
          </Link>
        </div>

        <div className="collection-grid collection-grid--3col reveal">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} priority={i < 3} />
          ))}
        </div>
      </section>

      {/* THE ELEMENTS */}
      <section id="materials">
        <span className="section-label reveal">The Elements</span>
        <h2 className="section-title reveal">Uncompromised <em>Quality</em></h2>
        <div className="materials-layout reveal">
          <div className="hotspot-container">
            <SmartImage
              src="/Images/image-2.jpeg"
              alt="Woven bag detail"
              fill
              width={900}
              sizes="(max-width: 900px) 100vw, 45vw"
            />
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

      {/* LOOKBOOK — every image is managed from the admin panel. */}
      {lookbook.length > 0 && (
        <section id="lookbook">
          <div className="lookbook-header reveal">
            <span className="section-label">Lookbook</span>
            <h2 className="section-title">Crafted with <em>Soul</em></h2>
          </div>

          <div className="reveal lookbook-gallery">
            {lookbook.map((shot, i) => (
              <button
                type="button"
                key={`${shot.src}-${i}`}
                className="lookbook-tile"
                onClick={() => setLightboxIndex(i)}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={shot.caption || `Lookbook image ${i + 1}`}
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
      )}

      <Lightbox
        items={lookbook}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndex={setLightboxIndex}
      />

      {/* REVIEWS — added, ordered and removed from the admin panel. */}
      {reviews.length > 0 && (
        <section id="testimonials">
          <div className="testimonial-header reveal">
            <span className="section-label">Kind Words</span>
            <h2 className="section-title">What our <em>customers</em> say</h2>
          </div>

          <div className="testimonial-grid reveal">
            {reviews.map((r) => (
              <figure key={r._id} className="testimonial">
                <Stars value={r.rating} size="sm" />
                {r.title && <h3 className="testimonial-title">{r.title}</h3>}
                <blockquote className="testimonial-body">{r.body}</blockquote>
                <figcaption className="testimonial-author">
                  <span className="testimonial-avatar" aria-hidden="true">
                    {r.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                  </span>
                  <span className="testimonial-who">
                    <strong>{r.name}</strong>
                    {r.location && <span>{r.location}</span>}
                  </span>
                  {r.product?.name && <em>{r.product.name}</em>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* CLIENT CARE */}
      <section id="concierge">
        <div className="concierge-inner reveal">
          <div className="concierge-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
            </svg>
          </div>
          <span className="section-label">Client Care</span>
          <h2 className="section-title">We help you choose the <em>right</em> bag</h2>

          <div className="concierge-ctas">
            <Link to="/contact" className="whatsapp-btn">Contact Client Care</Link>
            <Link to="/faq" className="btn-ghost" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>Read FAQ</Link>
          </div>
        </div>
      </section>
    </>
  );
}
