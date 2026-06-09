import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '../api';
import Toast from '../components/Toast';
import InfoTip from '../components/ui/InfoTip';

const AVAILABLE_SIZES = ['Small', 'Medium', 'Large', 'One Size'];
const AVAILABLE_TAGS = ['New Arrival', 'Best Seller', 'Limited Edition', 'Sale', 'Featured'];
const CATEGORIES = ['Tote', 'Crossbody', 'Clutch', 'Backpack', 'Wallet', 'General'];

const emptyForm = {
  name: '', description: '', price: '', originalPrice: '',
  category: 'General', stock: '', material: '', weight: '',
  isFeatured: false, isActive: true
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [colors, setColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
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
        stock: product.stock,
        material: product.material || '',
        weight: product.weight || '',
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== false
      });
      setColors(product.colors || []);
      setSelectedSizes(product.sizes || []);
      setSelectedTags(product.tags || []);
    } else {
      setEditId(null);
      setFormData({ ...emptyForm });
      setColors([]);
      setSelectedSizes([]);
      setSelectedTags([]);
    }
    setImageFiles([]);
    setShowModal(true);
  };

  const handleAddColor = () => {
    setColors([...colors, { name: '', hex: '#000000' }]);
  };

  const handleRemoveColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleColorChange = (index, field, value) => {
    const updated = [...colors];
    updated[index] = { ...updated[index], [field]: value };
    setColors(updated);
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
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
    data.append('material', formData.material);
    data.append('weight', formData.weight);
    data.append('isFeatured', formData.isFeatured);
    data.append('isActive', formData.isActive);

    // JSON-encode array fields
    data.append('colors', JSON.stringify(colors)); // Do not filter silently, let 'required' catch it
    data.append('sizes', JSON.stringify(selectedSizes));
    data.append('tags', JSON.stringify(selectedTags));
    
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
            <li><strong>Stock</strong> controls availability ("Out of Stock" if 0; "Low Stock" if ≤ 5).</li>
            <li><strong>Category</strong> is used in Shop filters.</li>
            <li><strong>Colors</strong>: add color name + hex for swatches on product page.</li>
            <li><strong>Tags</strong>: badges shown on product cards (e.g., "New Arrival").</li>
            <li><strong>Active</strong>: inactive products are hidden from the shop.</li>
          </ul>
        </div>
      </div>

      <div className="admin-nav">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/products" className="active">Products</Link>
        <Link to="/admin/users">Users</Link>
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
              <th>Colors</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} style={{ opacity: p.isActive === false ? 0.5 : 1 }}>
                <td>
                  <img src={p.images?.[0] || '/premium/flatlay-marble.jpg'} alt={p.name} />
                  {p.images && p.images.length > 1 && (
                    <div style={{ fontSize: '10px', color: 'var(--gray)', marginTop: '4px', textAlign: 'center' }}>
                      {p.images.length} images
                    </div>
                  )}
                </td>
                <td>
                  {p.name}
                  {p.isFeatured && <span className="admin-featured-badge">★ Featured</span>}
                </td>
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
                  <div className="admin-color-swatches">
                    {p.colors && p.colors.map((c, i) => (
                      <span key={i} className="admin-color-dot" style={{ background: c.hex }} title={c.name}></span>
                    ))}
                    {(!p.colors || p.colors.length === 0) && <span style={{ color: 'var(--gray)', fontSize: '11px' }}>—</span>}
                  </div>
                </td>
                <td>
                  <div className="admin-tag-list">
                    {p.tags && p.tags.map((t, i) => (
                      <span key={i} className="admin-tag-chip">{t}</span>
                    ))}
                    {(!p.tags || p.tags.length === 0) && <span style={{ color: 'var(--gray)', fontSize: '11px' }}>—</span>}
                  </div>
                </td>
                <td>
                  <span className={`admin-status-indicator ${p.isActive !== false ? 'active' : 'inactive'}`}>
                    {p.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
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
              {/* Name */}
              <div className="checkout-form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              {/* Description */}
              <div className="checkout-form-group">
                <label>Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
              </div>

              {/* Price row */}
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

              {/* Stock + Category */}
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Stock</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                </div>
                <div className="checkout-form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Material + Weight */}
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Material <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>(e.g., Premium Woven Leather)</small></label>
                  <input type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
                </div>
                <div className="checkout-form-group">
                  <label>Weight <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>(e.g., 350g)</small></label>
                  <input type="text" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
              </div>

              {/* Colors */}
              <div className="checkout-form-group">
                <label>Colors</label>
                <div className="admin-colors-editor">
                  {colors.map((color, index) => (
                    <div key={index} className="admin-color-row">
                      <input
                        type="color"
                        value={color.hex}
                        onChange={e => handleColorChange(index, 'hex', e.target.value)}
                        className="admin-color-input"
                      />
                      <input
                        type="text"
                        placeholder="Color name (e.g., Midnight Black)"
                        value={color.name}
                        onChange={e => handleColorChange(index, 'name', e.target.value)}
                        className="admin-color-name-input"
                        required
                      />
                      <button type="button" className="admin-color-remove" onClick={() => handleRemoveColor(index)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="admin-add-color-btn" onClick={handleAddColor}>
                    + Add Color
                  </button>
                </div>
              </div>

              {/* Sizes */}
              <div className="checkout-form-group">
                <label>Sizes</label>
                <div className="admin-chips-group">
                  {AVAILABLE_SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`admin-chip ${selectedSizes.includes(size) ? 'selected' : ''}`}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="checkout-form-group">
                <label>Tags</label>
                <div className="admin-chips-group">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`admin-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="admin-toggles-row">
                <label className="admin-toggle-label">
                  <span className={`admin-toggle-switch ${formData.isFeatured ? 'on' : ''}`} onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}>
                    <span className="admin-toggle-knob"></span>
                  </span>
                  <span>Featured Product</span>
                </label>
                <label className="admin-toggle-label">
                  <span className={`admin-toggle-switch ${formData.isActive ? 'on' : ''}`} onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                    <span className="admin-toggle-knob"></span>
                  </span>
                  <span>Active (Visible in Shop)</span>
                </label>
              </div>

              {/* Images */}
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
