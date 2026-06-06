import PageHeader from '../components/ui/PageHeader';
import Accordion from '../components/ui/Accordion';

export default function About() {
  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'About Us' },
          ]}
          eyebrow="Discover Wovena"
          title={
            <>
              About <em>Us</em>
            </>
          }
          subtitle="Wovena is inspired by ancient weaving traditions and built for modern life. This page explains what we make, why we make it, and how to care for it so your bag stays beautiful for years."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 28, alignItems: 'start' }}>
          <div className="card card-pad">
            <h2 className="section-title" style={{ fontSize: 24, marginBottom: 12 }}>
              Craft that <em>lasts</em>
            </h2>
            <p className="section-body" style={{ maxWidth: 'none' }}>
              Our pieces are designed with a simple goal: durability without losing elegance. We focus on strong structure, clean finishing, and a balanced silhouette—so the bag feels premium in your hand and reliable in everyday use.
            </p>
            <div className="gold-line" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 300, marginBottom: 10 }}>
              What makes Wovena different
            </h3>
            <ul className="help-list">
              <li>Minimal design, strong details (stitching, edge finishing, structured shape).</li>
              <li>Woven textures paired with modern straps and hardware placement.</li>
              <li>Comfort-first sizing for daily carry (phone, wallet, keys, essentials).</li>
            </ul>
          </div>

          <div className="card card--soft card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 300, marginBottom: 10 }}>
              Quick guide
            </h3>
            <p className="help-text">
              New here? Start with <strong>Shop</strong> to explore categories, then open any product for full details, materials, and care instructions.
            </p>
            <ul className="help-list">
              <li>Shop → filter by category, search, and open product details.</li>
              <li>Product page → read details + “Materials &amp; Care”.</li>
              <li>Checkout → fill shipping information and pay Cash on Delivery.</li>
            </ul>
          </div>
        </div>

        <div className="card card-pad" style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>
            Common <em>Questions</em>
          </h2>
          <p className="help-text" style={{ marginBottom: 6 }}>
            If you still need help, check the full FAQ and Shipping pages for more details.
          </p>

          <Accordion
            defaultOpenIndex={0}
            items={[
              {
                title: 'Are your bags handmade?',
                content:
                  'Many parts of the process involve careful craftsmanship especially the woven body and finishing. Exact methods can vary by design, but our focus remains consistent: neat finishing, strong structure, and lasting shape.',
              },
              {
                title: 'How do I keep the bag looking new?',
                content:
                  'Avoid moisture exposure, store it in a dry place, and clean gently using a soft cloth. See the Care Guide page for step-by-step instructions.',
              },
              {
                title: 'What if I need help choosing a bag?',
                content:
                  'Open any product page and read the details + recommended use. If you want, tell me your use-case (work, events, travel) and I can suggest the best category and size.',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

