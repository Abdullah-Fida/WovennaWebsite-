import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo-text">Wovenaa</div>
          <div className="footer-tagline">Since 2000 BC</div>
          <p>Woven bags carrying 4,000 years of craft. Built for permanence, not just seasons.</p>
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
            <li><Link to="/about">Our Story</Link></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h5>Client Care</h5>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/shipping-returns">Shipping & Returns</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2026 Wovenaa. All rights reserved.</p>
        <p>Crafted in <span>Pakistan</span></p>
      </div>
    </footer>
  );
}
