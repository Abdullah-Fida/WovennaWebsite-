import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { count: cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onHero = location.pathname === '/' && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`main-nav ${scrolled ? 'scrolled' : ''} ${onHero ? 'on-hero' : ''}`}>
        <Link to="/" className="nav-logo">
          <Logo className="nav-logo-svg" />
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/#collection">Shop</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          {/* Guests have no "My Orders", so surface tracking in the main nav. */}
          {!user && <li><Link to="/track-order">Track Order</Link></li>}
          {user?.role === 'admin' && <li><Link to="/admin">Dashboard</Link></li>}
        </ul>

        <div className="nav-right">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button className="nav-user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>

              <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
                <div className="user-dropdown-name">Hi, {user.name}</div>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/orders">Manage Orders</Link>
                    <Link to="/admin/products">Manage Products</Link>
                  </>
                ) : (
                  <>
                    <Link to="/profile">My Profile</Link>
                    <Link to="/orders">My Orders</Link>
                  </>
                )}
                <button onClick={handleLogout} style={{ color: '#ef4444' }}>Log Out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-cta">Sign In</Link>
          )}

          <Link to="/cart" className="nav-cart-btn" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}>
              <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span className={`cart-badge ${cartCount > 0 ? 'show' : ''}`}>{cartCount}</span>
          </Link>

          <button className={`nav-hamburger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>×</button>
        <Link to="/" className="mobile-menu-link">Home</Link>
        <Link to="/#collection" className="mobile-menu-link">Shop Collection</Link>
        <Link to="/about" className="mobile-menu-link">About Us</Link>
        <Link to="/shipping-returns" className="mobile-menu-link">Shipping</Link>
        <Link to="/contact" className="mobile-menu-link">Contact</Link>

        {user ? (
          <>
            {user.role === 'admin' ? (
              <Link to="/admin" className="mobile-menu-link">Dashboard</Link>
            ) : (
              <>
                <Link to="/profile" className="mobile-menu-link">My Profile</Link>
                <Link to="/orders" className="mobile-menu-link">My Orders</Link>
              </>
            )}
            <button onClick={handleLogout} className="mobile-menu-link" style={{ color: '#ef4444' }}>Log Out</button>
          </>
        ) : (
          <>
            <Link to="/track-order" className="mobile-menu-link">Track Order</Link>
            <Link to="/login" className="mobile-menu-link">Sign In / Register</Link>
          </>
        )}
      </div>
    </>
  );
}
