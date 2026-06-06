import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '../api';
import Toast from '../components/Toast';
import InfoTip from '../components/ui/InfoTip';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', originalPrice: '', category: 'General', stock: ''
  });
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditId(product._id);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || '',
        category: product.category,
        stock: product.stock
      });
    } else {
      setEditId(null);
      setFormData({ name: '', description: '', price: '', originalPrice: '', category: 'General', stock: '' });
    }
    setImageFiles([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    if (formData.originalPrice) {
      data.append('originalPrice', formData.originalPrice);
    }
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    
    for (let i = 0; i < imageFiles.length; i++) {
      data.append('images', imageFiles[i]);
    }

    try {
      if (editId) {
        await updateProduct(editId, data);
        setToastMsg('Product updated');
      } else {
        await createProduct(data);
        setToastMsg('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setToastMsg('Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setToastMsg('Product deleted');
        fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      
      <div className="admin-header">
        <h1>Manage <em>Products</em></h1>
        <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal()}>+ Add Product</button>
      </div>

      <div className="card card--soft card-pad" style={{ marginBottom: 26 }}>
        <div className="help-text">
          How this page works <InfoTip tip="Add Product opens a modal. Upload multiple images if you have lifestyle shots—image #1 is used as primary in cards." ariaLabel="Products help" />:
          <ul className="help-list">
            <li><strong>Stock</strong> controls availability (“Out of Stock” if 0; “Low Stock” if ≤ 5).</li>
            <li><strong>Category</strong> is used in Shop filters.</li>
            <li><strong>Images</strong>: first image is primary, second image is shown on hover.</li>
          </ul>
        </div>
      </div>

      <div className="admin-nav">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/products" className="active">Products</Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>
                  <img src={p.images?.[0] || '/premium/flatlay-marble.jpg'} alt={p.name} />
                  {p.images && p.images.length > 1 && (
                    <div style={{ fontSize: '10px', color: 'var(--gray)', marginTop: '4px', textAlign: 'center' }}>
                      {p.images.length} images
                    </div>
                  )}
                </td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>
                  Rs. {p.price.toLocaleString()}
                  {p.originalPrice && p.originalPrice > p.price && (
                    <div style={{ textDecoration: 'line-through', color: 'var(--gray)', fontSize: '11px' }}>
                      Rs. {p.originalPrice.toLocaleString()}
                    </div>
                  )}
                </td>
                <td>{p.stock}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleOpenModal(p)}>Edit</button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(p._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-bg">
          <div className="admin-modal">
            <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            <h2 className="section-title" style={{ fontSize: '28px' }}>{editId ? 'Edit' : 'Add'} <em>Product</em></h2>
            
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="checkout-form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="checkout-form-group">
                <label>Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
              </div>
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Sale Price (Rs.)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="checkout-form-group">
                  <label>Original Price (Rs.) <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>(Optional, shows crossed out)</small></label>
                  <input type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} />
                </div>
              </div>
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Stock</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                </div>
                <div className="checkout-form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Tote">Tote</option>
                    <option value="Crossbody">Crossbody</option>
                  </select>
                </div>
              </div>
              <div className="checkout-form-group">
                <label>Images</label>
                <input type="file" multiple accept="image/*" onChange={e => setImageFiles(e.target.files)} style={{ border: 'none', padding: '14px 0' }} />
                <small style={{ color: 'var(--gray)' }}>{editId ? 'Upload new images to replace existing ones, or leave blank to keep current.' : ''}</small>
              </div>
              
              <button type="submit" className="auth-submit-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
