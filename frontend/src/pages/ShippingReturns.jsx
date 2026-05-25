import PageHeader from '../components/ui/PageHeader';
import Accordion from '../components/ui/Accordion';

export default function ShippingReturns() {
  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Shipping & Returns' },
          ]}
          eyebrow="Client Care"
          title={
            <>
              Shipping &amp; <em>Returns</em>
            </>
          }
          subtitle="Clear expectations matter. This page explains delivery timelines, Cash on Delivery, what happens after you place an order, and how returns are handled."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Shipping
            </h3>
            <ul className="help-list">
              <li>Payment: Cash on Delivery (COD)</li>
              <li>Order confirmation: we may call/message to confirm details</li>
              <li>Dispatch: usually within 24–48 hours (working days)</li>
              <li>Delivery: depends on city/area (commonly 2–5 working days)</li>
            </ul>
            <div className="gold-line" />
            <p className="help-text">
              Tip: Always provide a reachable phone number at checkout to avoid delays.
            </p>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Returns / Exchanges
            </h3>
            <p className="help-text">
              Policy details can vary by product. Below is a clear default structure you can customize:
            </p>
            <ul className="help-list">
              <li>Report issues within 48 hours of delivery</li>
              <li>Item must be unused and in original packaging</li>
              <li>Exchange is preferred; refunds depend on case review</li>
              <li>Shipping costs for returns may apply (case-dependent)</li>
            </ul>
          </div>
        </div>

        <div className="card card--soft card-pad" style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ fontSize: 24, marginBottom: 10 }}>
            Detailed <em>FAQ</em>
          </h2>

          <Accordion
            defaultOpenIndex={0}
            items={[
              {
                title: 'What happens right after I place an order?',
                content:
                  'Your order is created and marked as “Processing”. Our team may contact you to confirm your address/phone, then the parcel is prepared for dispatch.',
              },
              {
                title: 'Do you deliver nationwide?',
                content:
                  'Typically yes within Pakistan, depending on courier coverage. If your area is remote, we may confirm an adjusted timeline before dispatch.',
              },
              {
                title: 'What if my order is delayed?',
                content:
                  'Delays can happen due to courier load, weather, or missing phone/address details. Contact Client Care with your order ID so we can check the latest status.',
              },
              {
                title: 'How do I request a return/exchange?',
                content:
                  'Contact Client Care with your order ID, reason, and photos (if damaged). We’ll confirm eligibility and guide you through the next steps.',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

