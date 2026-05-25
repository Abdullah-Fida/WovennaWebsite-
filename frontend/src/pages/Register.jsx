import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InfoTip from '../components/ui/InfoTip';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      // Registration successful, redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create <em>Account</em></h2>
        <p className="auth-subtitle">Join the Wovenaa family</p>

        <div className="help-text" style={{ textAlign: 'center', marginBottom: 20 }}>
          Creating an account lets you checkout faster and track all your orders in one place.
        </div>
        
        {error && <div className="auth-error" style={{ marginBottom: '24px' }}>{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            <div className="help-text" style={{ marginTop: 8 }}>Use your real name for delivery confirmation.</div>
          </div>
          <div>
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="help-text" style={{ marginTop: 8 }}>We use this email for account and order updates.</div>
          </div>
          <div>
            <label>
              Password <InfoTip tip="Use at least 6 characters. A longer password is safer." ariaLabel="Password tips" />
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="help-text" style={{ marginTop: 8 }}>Tip: use a mix of letters and numbers.</div>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
