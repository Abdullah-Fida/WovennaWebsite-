import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';

export default function PrivacyPolicy() {
  return (
    <div className="page">
      <div className="container">
        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Privacy Policy' },
          ]}
          eyebrow="Legal"
          title={
            <>
              Privacy <em>Policy</em>
            </>
          }
          subtitle="Your privacy matters to us. This policy explains how Wovenaa collects, uses, and protects your personal information."
        />

        <div className="privacy-content">
          <section className="privacy-section">
            <h2>1. Information We Collect</h2>
            <p>
              When you visit our website, place an order, or contact us, we may collect the following information:
            </p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, and shipping address when you place an order or create an account.</li>
              <li><strong>Order Information:</strong> Products purchased, order history, payment method preference (Cash on Delivery).</li>
              <li><strong>Usage Data:</strong> Browser type, IP address, pages viewed, and time spent on our website to improve your experience.</li>
              <li><strong>Communication Data:</strong> Messages sent through our contact form or customer support channels.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li>Processing and fulfilling your orders, including shipping and delivery.</li>
              <li>Sending order confirmations and delivery updates via email.</li>
              <li>Responding to your customer service inquiries and support requests.</li>
              <li>Improving our website, products, and services based on user feedback and browsing behavior.</li>
              <li>Preventing fraudulent transactions and ensuring the security of our platform.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. Information Sharing</h2>
            <p>
              We do <strong>not</strong> sell, trade, or rent your personal information to third parties. We may share your information only in the following cases:
            </p>
            <ul>
              <li><strong>Delivery Partners:</strong> Your name, address, and phone number are shared with our courier/logistics partners solely for order delivery.</li>
              <li><strong>Legal Requirements:</strong> If required by law or to protect the rights, property, or safety of Wovenaa, our customers, or others.</li>
              <li><strong>Service Providers:</strong> Trusted third-party services that assist us in operating our website (e.g., hosting, analytics) under strict data protection agreements.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul>
              <li>Encrypted data transmission (HTTPS/SSL).</li>
              <li>Secure server infrastructure with regular security updates.</li>
              <li>Restricted access to personal data on a need-to-know basis.</li>
            </ul>
            <p>
              However, no method of electronic storage or transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Cookies</h2>
            <p>
              Our website uses cookies and similar technologies to enhance your browsing experience. Cookies help us:
            </p>
            <ul>
              <li>Remember your preferences and login sessions.</li>
              <li>Understand how you interact with our website.</li>
              <li>Deliver relevant content and improve site performance.</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling cookies may limit certain features of our website.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Guest Checkout</h2>
            <p>
              We offer guest checkout so you can place orders without creating an account. When you check out as a guest:
            </p>
            <ul>
              <li>We collect only the information necessary to process and deliver your order (name, email, phone, shipping address).</li>
              <li>Your data is stored securely and used solely for order fulfillment and communication.</li>
              <li>You will not have access to order history or account features unless you create an account.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and request a copy of your personal data.</li>
              <li>Request correction of inaccurate or incomplete information.</li>
              <li>Request deletion of your personal data (subject to legal obligations).</li>
              <li>Opt out of marketing communications at any time.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <Link to="/contact" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(197,160,89,0.35)' }}>
                our Contact page
              </Link>.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. The updated policy will be posted on this page with the revised date.
            </p>
          </section>

          <section className="privacy-section">
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please don't hesitate to reach out:
            </p>
            <div className="privacy-contact-box">
              <p><strong>Wovenaa</strong></p>
              <p>Email: support@wovenaa.com</p>
              <p>
                Visit our{' '}
                <Link to="/contact" style={{ color: 'var(--gold)', borderBottom: '1px solid rgba(197,160,89,0.35)' }}>
                  Contact Page
                </Link>
              </p>
            </div>
          </section>

          <div className="privacy-footer-note">
            <p>Last updated: June 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
