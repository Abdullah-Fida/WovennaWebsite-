import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import InfoTip from '../components/ui/InfoTip';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Contact' },
          ]}
          eyebrow="Client Care"
          title={
            <>
              Contact <em>Us</em>
            </>
          }
          subtitle="Need help with a product, sizing, or an order? This page explains the fastest ways to reach us, plus what information to include for quick support."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 28, alignItems: 'start' }}>
          <div className="card card--soft card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Fast support
            </h3>
            <p className="help-text">
              For the quickest reply, message us on WhatsApp with your order ID (if you have one) and a short description of the issue.
            </p>
            <ul className="help-list">
              <li>WhatsApp: +92 3XX XXXXXXX</li>
              <li>Email: support@wovenaa.com</li>
              <li>Hours: Mon–Sat, 10:00–18:00</li>
            </ul>

            <div className="gold-line" />
            <p className="help-text">
              What to include <InfoTip tip="Order ID helps us find your details quickly. If it’s a product question, share the product name or screenshot." />:
            </p>
            <ul className="help-list">
              <li>Order ID (last 6 characters is enough)</li>
              <li>Product name (or screenshot)</li>
              <li>City + preferred delivery timing</li>
            </ul>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, marginBottom: 10 }}>
              Send a message
            </h3>
            <p className="help-text" style={{ marginBottom: 18 }}>
              This form is a UI placeholder (no backend endpoint connected yet). If you want, I can connect it to a real email/CRM endpoint.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="admin-form">
              <div className="checkout-form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="checkout-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@email.com"
                />
              </div>
              <div className="checkout-form-group">
                <label>Message</label>
                <textarea
                  rows="5"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what you need help with..."
                />
                <div className="help-text" style={{ marginTop: 10 }}>
                  Tip: If this is about an order, add your order ID and phone number.
                </div>
              </div>

              <button type="button" className="auth-submit-btn" onClick={() => alert('Contact form is UI-only right now.')}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

