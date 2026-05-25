import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InfoTip from '../components/ui/InfoTip';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/shop');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome <em>Back</em></h2>
        <p className="auth-subtitle">Sign in to your account</p>

        <div className="help-text" style={{ textAlign: 'center', marginBottom: 20 }}>
          Sign in to access your cart, checkout, and order tracking.
        </div>
        
        {error && <div className="auth-error" style={{ marginBottom: '24px' }}>{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="help-text" style={{ marginTop: 8 }}>Use the same email you used during registration.</div>
          </div>
          <div>
            <label>
              Password <InfoTip tip="If you forgot your password, we can add a reset flow later. For now, register again or contact support." ariaLabel="Password help" />
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="help-text" style={{ marginTop: 8 }}>Keep your password private and don’t share it with anyone.</div>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
