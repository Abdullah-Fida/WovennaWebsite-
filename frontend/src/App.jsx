import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { captureReferral } from './lib/referral';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Info Pages
import About from './pages/About';
import Materials from './pages/Materials';
import CareGuide from './pages/CareGuide';
import Contact from './pages/Contact';
import ShippingReturns from './pages/ShippingReturns';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Influencer Program
import InfluencerProgram from './pages/InfluencerProgram';
import InfluencerDashboard from './pages/InfluencerDashboard';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminPromos from './pages/AdminPromos';
import AdminInfluencers from './pages/AdminInfluencers';
import AdminGallery from './pages/AdminGallery';
import AdminReviews from './pages/AdminReviews';

/**
 * The collection now lives on the homepage, but /shop is linked from the
 * navbar, the footer, old emails and every influencer referral link. Rather
 * than break those, send them to the collection section and keep the query
 * string so ?ref= still lands.
 */
function ShopRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/${search}#collection`} replace />;
}

// Remembers an influencer's ?ref= code for the rest of the visit.
function ReferralCatcher() {
  const location = useLocation();
  useEffect(() => {
    captureReferral(location.search);
  }, [location.search]);
  return null;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ReferralCatcher />
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<ShopRedirect />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Info Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/care" element={<CareGuide />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/shipping-returns" element={<ShippingReturns />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />

              {/* Cart & Checkout — accessible to guests for guest checkout */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Influencer Program */}
              <Route path="/influencers" element={<InfluencerProgram />} />
              <Route
                path="/influencers/dashboard"
                element={<ProtectedRoute><InfluencerDashboard /></ProtectedRoute>}
              />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/promos" element={<AdminRoute><AdminPromos /></AdminRoute>} />
              <Route path="/admin/influencers" element={<AdminRoute><AdminInfluencers /></AdminRoute>} />
              <Route path="/admin/gallery" element={<AdminRoute><AdminGallery /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
