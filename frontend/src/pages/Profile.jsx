import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import PageHeader from '../components/ui/PageHeader';
import InfoTip from '../components/ui/InfoTip';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        city: data.city || '',
        phone: data.phone || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setToastMsg('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="container">
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />

        <PageHeader
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'My Profile' },
          ]}
          eyebrow="Account"
          title={
            <>
              My <em>Profile</em>
            </>
          }
          subtitle="Keep your details updated for faster checkout and smoother delivery. Your email is your login identity."
        />

        <div className="card card-pad" style={{ maxWidth: 760 }}>
          <div className="help-text" style={{ marginBottom: 18 }}>
            Email: <strong>{user.email}</strong>{' '}
            <InfoTip tip="Email is currently used as your account identifier. If you want, we can add a change-email flow later." ariaLabel="Email info" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="profile-info">
              <div className="profile-field">
                <label>Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                <div className="help-text" style={{ marginTop: 8 }}>This name can be used for delivery confirmation.</div>
              </div>
              <div className="profile-field">
                <label>Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. 03XX XXXXXXX" />
                <div className="help-text" style={{ marginTop: 8 }}>Use an active number so courier can reach you.</div>
              </div>
              <div className="profile-field">
                <label>Address</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="House no, street, area" />
              </div>
              <div className="profile-field">
                <label>City</label>
                <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
