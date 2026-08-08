import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="nav-logo" style={{ marginBottom: '16px' }}>
            <Logo className="footer-logo-svg" />
          </Link>
          <p>Woven bags Carrying 4000 years Legacy. Built for permanence, Not just Seasons.</p>
        </div>

        <div className="footer-col">
          <h5>Shop</h5>
          <ul>
            <li><Link to="/shop">All Bags</Link></li>
            <li><Link to="/shop?category=Tote">Tote Bags</Link></li>
            <li><Link to="/shop?category=Crossbody">Crossbody</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Discover</h5>
          <ul>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Client Care</h5>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/shipping-returns">Shipping &amp; Returns</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Wovenaa. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
        <p>Crafted in <span>Pakistan</span></p>
      </div>
    </footer>
  );
}
