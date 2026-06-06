import PageHeader from '../components/ui/PageHeader';
import Accordion from '../components/ui/Accordion';

export default function CareGuide() {
  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Care Guide' },
          ]}
          eyebrow="Care & Maintenance"
          title={
            <>
              Care <em>Guide</em>
            </>
          }
          subtitle="A few simple habits will keep your Wovena bag looking fresh. Follow these steps for cleaning, storage, and long-term care."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Everyday care
            </h3>
            <ul className="help-list">
              <li>Keep it dry—natural fibers don’t like soaking.</li>
              <li>Avoid sharp objects that can catch the weave.</li>
              <li>Don’t overload the bag; it protects the handles and base.</li>
            </ul>
          </div>
          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Storage
            </h3>
            <ul className="help-list">
              <li>Store upright in a cool, dry place.</li>
              <li>Use light stuffing (paper/cloth) to keep shape.</li>
              <li>Avoid direct sunlight for long periods.</li>
            </ul>
          </div>
        </div>

        <div className="card card--soft card-pad" style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ fontSize: 24, marginBottom: 10 }}>
            Cleaning <em>Steps</em>
          </h2>
          <ol className="help-list" style={{ paddingLeft: 20 }}>
            <li>Dust off woven areas using a soft brush (follow the weave direction).</li>
            <li>Wipe trims/handles with a slightly damp cloth, then dry immediately.</li>
            <li>If needed, use a mild soap solution—test on a hidden area first.</li>
            <li>Air-dry naturally (no hairdryer/heater).</li>
          </ol>

          <Accordion
            defaultOpenIndex={0}
            items={[
              {
                title: 'What if my bag gets wet?',
                content:
                  'Pat dry gently with a clean towel and let it air-dry in shade. Avoid direct heat. Once dry, lightly brush the weave to restore texture.',
              },
              {
                title: 'Can I wash it fully?',
                content:
                  'We do not recommend full soaking or machine washing. Use spot-cleaning for woven areas and gentle wiping for trims.',
              },
              {
                title: 'How do I avoid odor?',
                content:
                  'Keep it dry and stored in a ventilated place. If needed, place a small sachet (dry) inside while storing.',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

