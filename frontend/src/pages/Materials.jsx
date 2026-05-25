import PageHeader from '../components/ui/PageHeader';
import Accordion from '../components/ui/Accordion';

export default function Materials() {
  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Materials' },
          ]}
          eyebrow="The Elements"
          title={
            <>
              Materials &amp; <em>Quality</em>
            </>
          }
          subtitle="We design each bag as a balance of texture, structure, and comfort. Here’s what goes into the build, and what each material means for daily use."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Vegan Leather
            </h3>
            <p className="section-body" style={{ maxWidth: 'none' }}>
              Used for handles, trims, and reinforcement points. It improves structure, protects the woven edges, and makes the bag feel premium without adding heavy weight.
            </p>
            <div className="gold-line" />
            <p className="help-text">
              Tip: keep away from high heat. For light cleaning, use a damp cloth and wipe dry immediately.
            </p>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Natural Straw / Woven Fibers
            </h3>
            <p className="section-body" style={{ maxWidth: 'none' }}>
              The woven body gives signature texture and strength. Tight weaving helps the bag hold shape while staying flexible for comfortable carrying.
            </p>
            <div className="gold-line" />
            <p className="help-text">
              Tip: avoid soaking. If it gets dusty, use a soft brush and clean along the weave direction.
            </p>
          </div>
        </div>

        <div className="card card--soft card-pad" style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ fontSize: 24, marginBottom: 10 }}>
            Durability <em>Notes</em>
          </h2>
          <ul className="help-list">
            <li>Structure depends on weave tightness + reinforcement points (handles, corners, base).</li>
            <li>For long life: store with light stuffing (paper or cloth) to keep shape.</li>
            <li>Keep away from prolonged moisture to protect natural fibers.</li>
          </ul>

          <Accordion
            defaultOpenIndex={0}
            items={[
              {
                title: 'Will the bag lose its shape?',
                content:
                  'Like any woven product, shape depends on how you store and carry it. Avoid overloading and store it upright with light stuffing when not in use.',
              },
              {
                title: 'Can I use it daily?',
                content:
                  'Yes—these designs are made for daily carry. For best results, avoid sharp objects that may pull the weave, and keep the bag dry.',
              },
              {
                title: 'How do I remove stains?',
                content:
                  'Start gently: wipe trims with a damp cloth, and use a soft brush for woven areas. For persistent stains, test a small hidden area first.',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

