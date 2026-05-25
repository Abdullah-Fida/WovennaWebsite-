import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
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

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';

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
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
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
            
            {/* Protected User Routes */}
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
