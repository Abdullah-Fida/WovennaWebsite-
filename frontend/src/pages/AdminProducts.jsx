import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '../api';
import Toast from '../components/Toast';
import ImageManager from '../components/admin/ImageManager';
import { compressImages } from '../lib/compress';

const AVAILABLE_SIZES = ['Small', 'Medium', 'Large', 'One Size'];
const AVAILABLE_TAGS = ['New Arrival', 'Best Seller', 'Limited Edition', 'Sale', 'Featured'];
const CATEGORIES = ['Tote', 'Crossbody', 'Clutch', 'Backpack', 'Wallet', 'General'];

const emptyForm = {
  name: '', description: '', price: '', originalPrice: '',
  category: 'General', stock: '', material: '', weight: '',
  dimensions: '', widthCm: '', heightCm: '', careInstructions: 'Wipe with dry cloth. Keep away from water.',
  isFeatured: false, showInSoldOutRow: false, isActive: true
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [colors, setColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [variants, setVariants] = useState([]);

  // One ordered gallery holding both saved images and newly picked files, so
  // a new photo can be dragged ahead of an old one. Position 0 is the cover.
  const [gallery, setGallery] = useState([]);
  const [preparing, setPreparing] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError('');
      const data = await getAdminProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load products');
      setToastMsg(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Build the variant grid from the chosen colours × sizes, carrying over
  // everything already entered for a combination so re-generating the grid
  // never wipes prices, stock or photos.
  const buildVariantGrid = (colorsList, sizesList, existingVariants = []) => {
    if (colorsList.length === 0 && sizesList.length === 0) return [];

    const colorsToUse = colorsList.length > 0 ? colorsList : [{ name: '' }];
    const sizesToUse = sizesList.length > 0 ? sizesList : [''];

    const newVariants = [];
    for (const color of colorsToUse) {
      for (const size of sizesToUse) {
        const existing = existingVariants.find(
          v => (v.color || '') === (color.name || '') && (v.size || '') === (size || '')
        );
        newVariants.push({
          color: color.name || '',
          size: size || '',
          sku: existing?.sku || '',
          price: existing?.price ?? '',
          originalPrice: existing?.originalPrice ?? '',
          stock: existing?.stock ?? 0,
          image: existing?.image || ''
        });
      }
    }
    return newVariants;
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Every image currently on the product, saved or pending, as display URLs.
  const galleryUrls = () => gallery.map((g) => g.preview || g.url);

  // Cycle a variant through the gallery: none -> image 1 -> image 2 -> none.
  const cycleVariantImage = (index) => {
    const urls = galleryUrls();
    if (urls.length === 0) {
      setToastMsg('Add product images first, then assign one to each variant');
      return;
    }
    setVariants(prev => {
      const next = [...prev];
      const at = urls.indexOf(next[index].image);
      const following = at + 1 >= urls.length ? '' : urls[at + 1];
      next[index] = { ...next[index], image: at === -1 ? urls[0] : following };
      return next;
    });
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
        dimensions: product.dimensions || '',
        widthCm: product.widthCm || '',
        heightCm: product.heightCm || '',
        careInstructions: product.careInstructions || 'Wipe with dry cloth. Keep away from water.',
        isFeatured: product.isFeatured || false,
        showInSoldOutRow: product.showInSoldOutRow || false,
        isActive: product.isActive !== false
      });
      const prodColors = product.colors || [];
      const prodSizes = product.sizes || [];
      setColors(prodColors);
      setSelectedSizes(prodSizes);
      setSelectedTags(product.tags || []);
      setVariants(product.variants || buildVariantGrid(prodColors, prodSizes, product.variants || []));
      setGallery((product.images || []).map((url) => ({ id: url, kind: 'existing', url })));
    } else {
      setEditId(null);
      setFormData({ ...emptyForm });
      setColors([]);
      setSelectedSizes([]);
      setSelectedTags([]);
      setVariants([]);
      setGallery([]);
    }
    gallery.forEach((g) => g.preview && URL.revokeObjectURL(g.preview));
    setError('');
    setShowModal(true);
  };

  // --- Image management -------------------------------------------------

  const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
  const MAX_IMAGES = 20;

  const handlePickImages = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // let the same file be re-picked after a removal

    const room = MAX_IMAGES - gallery.length;
    if (room <= 0) {
      setToastMsg(`Maximum ${MAX_IMAGES} images per product`);
      return;
    }

    const tooBig = picked.filter((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig.length) {
      setToastMsg(`${tooBig[0].name} is larger than 10MB and was skipped`);
    }

    const accepted = picked
      .filter((f) => f.size <= MAX_IMAGE_BYTES && f.type.startsWith('image/'))
      .slice(0, room);
    if (!accepted.length) return;

    // Shrink before upload. A phone photo goes from several MB to a few
    // hundred KB, which is most of why saving used to crawl.
    setPreparing(`Preparing ${accepted.length} image${accepted.length === 1 ? '' : 's'}…`);
    try {
      const ready = await compressImages(accepted, (done, total) =>
        setPreparing(`Preparing image ${done} of ${total}…`)
      );
      setGallery((prev) => [
        ...prev,
        ...ready.map((file, i) => ({
          id: `new-${Date.now()}-${i}`,
          kind: 'new',
          file,
          preview: URL.createObjectURL(file),
        })),
      ]);
    } finally {
      setPreparing('');
    }
  };

  // Dropping an image must also release any variant that was using it,
  // otherwise the variant would point at something no longer on the product.
  const handleGalleryChange = (next) => {
    const live = new Set(next.map((g) => g.preview || g.url));
    setVariants((prev) =>
      prev.some((v) => v.image && !live.has(v.image))
        ? prev.map((v) => (v.image && !live.has(v.image) ? { ...v, image: '' } : v))
        : prev
    );
    setGallery(next);
  };

  const handleAddColor = () => {
    const newColors = [...colors, { name: '', hex: '#000000' }];
    setColors(newColors);
    setVariants(buildVariantGrid(newColors, selectedSizes, variants));
  };

  const handleRemoveColor = (index) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
    setVariants(buildVariantGrid(newColors, selectedSizes, variants));
  };

  const handleColorChange = (index, field, value) => {
    const updated = [...colors];
    updated[index] = { ...updated[index], [field]: value };
    setColors(updated);
    if (field === 'name') {
      setVariants(buildVariantGrid(updated, selectedSizes, variants));
    }
  };

  const toggleSize = (size) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(newSizes);
    setVariants(buildVariantGrid(colors, newSizes, variants));
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleVariantStockChange = (variantIndex, newStock) => {
    const updated = [...variants];
    updated[variantIndex] = { ...updated[variantIndex], stock: Math.max(0, Number(newStock) || 0) };
    setVariants(updated);
    // Auto-update total stock
    const totalStock = updated.reduce((sum, v) => sum + (v.stock || 0), 0);
    setFormData(prev => ({ ...prev, stock: totalStock }));
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
    data.append('stock', formData.stock || 0);
    data.append('material', formData.material);
    data.append('weight', formData.weight);
    data.append('dimensions', formData.dimensions);
    data.append('widthCm', formData.widthCm);
    data.append('heightCm', formData.heightCm);
    data.append('careInstructions', formData.careInstructions);
    data.append('isFeatured', formData.isFeatured);
    data.append('showInSoldOutRow', formData.showInSoldOutRow);
    data.append('isActive', formData.isActive);

    // JSON-encode array fields
    data.append('colors', JSON.stringify(colors));
    data.append('sizes', JSON.stringify(selectedSizes));
    data.append('tags', JSON.stringify(selectedTags));
    // A variant may point at an image that hasn't been uploaded yet (a local
    // preview). The server can't match a blob: URL, so send the position it
    // will occupy in the final gallery instead.
    const variantPayload = variants.map((v) => {
      const at = gallery.findIndex((g) => (g.preview || g.url) === v.image);
      const { image, ...rest } = v;
      if (!v.image || at === -1) return { ...rest, image: '' };
      return gallery[at].kind === 'existing'
        ? { ...rest, image: gallery[at].url }
        : { ...rest, image: '', imageIndex: at };
    });
    data.append('variants', JSON.stringify(variantPayload));

    // Ordered list of saved images to keep — anything omitted gets deleted.
    data.append(
      'existingImages',
      JSON.stringify(gallery.filter((g) => g.kind === 'existing').map((g) => g.url))
    );

    // The arrangement the admin dragged into, mixing saved URLs with
    // placeholders for the files appended below.
    let newIndex = 0;
    const imageOrder = gallery.map((g) =>
      g.kind === 'existing' ? g.url : `new:${newIndex++}`
    );
    data.append('imageOrder', JSON.stringify(imageOrder));

    gallery.filter((g) => g.kind === 'new').forEach((g) => data.append('images', g.file));

    try {
      if (editId) {
        await updateProduct(editId, data);
        setToastMsg('Product updated successfully');
      } else {
        await createProduct(data);
        setToastMsg('Product created successfully');
      }
      gallery.forEach((g) => g.preview && URL.revokeObjectURL(g.preview));
      setGallery([]);
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      // Show the ACTUAL error from the backend instead of generic message
      setError(err.message || 'Error saving product');
      setToastMsg(err.message || 'Error saving product');
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
        setToastMsg(err.message || 'Failed to delete product');
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

      <AdminNav active="products" />

      {error && !products.length ? (
        <div className="state-panel">
          <h3>Could not load products</h3>
          <p>{error}</p>
          <button className="btn-gold" onClick={fetchProducts}>Try Again</button>
        </div>
      ) : (
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
              {products.length > 0 ? products.map(p => (
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
                    Rs. {(p.price || 0).toLocaleString()}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <div style={{ textDecoration: 'line-through', color: 'var(--gray)', fontSize: '11px' }}>
                        Rs. {p.originalPrice.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td>{p.stock || 0}</td>
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
              )) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray)' }}>No products yet. Click "+ Add Product" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
                  <label>Total Stock <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>{variants.length > 0 ? '(auto-calculated from variants)' : ''}</small></label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    required
                    readOnly={variants.length > 0}
                    style={variants.length > 0 ? { background: 'var(--cream)', cursor: 'not-allowed' } : {}}
                  />
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

              {/* Dimensions + Care */}
              <div className="checkout-form-group">
                <label>Overall Dimensions <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>(e.g., 19 cm × 8 cm × 19 cm)</small></label>
                <input type="text" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} />
              </div>
              <div className="checkout-form-row">
                <div className="checkout-form-group">
                  <label>Bag Width (cm) <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>(For Size Guide illustration)</small></label>
                  <input type="number" value={formData.widthCm} onChange={e => setFormData({...formData, widthCm: e.target.value})} />
                </div>
                <div className="checkout-form-group">
                  <label>Bag Height (cm) <small style={{ fontWeight: 'normal', color: 'var(--gray)' }}>(For Size Guide illustration)</small></label>
                  <input type="number" value={formData.heightCm} onChange={e => setFormData({...formData, heightCm: e.target.value})} />
                </div>
              </div>
              <div className="checkout-form-group">
                <label>Care Instructions</label>
                <input type="text" value={formData.careInstructions} onChange={e => setFormData({...formData, careInstructions: e.target.value})} />
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

              {/* Variants: price, stock and photo per colour + size */}
              {variants.length > 0 && (
                <div className="checkout-form-group">
                  <label>
                    Variants
                    <small style={{ fontWeight: 'normal', color: 'var(--gray)', marginLeft: 8 }}>
                      (Leave price blank to use the product price. Click a thumbnail
                      to assign that variant's photo.)
                    </small>
                  </label>

                  <div className="admin-variant-table-wrap">
                    <table className="admin-variant-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Variant</th>
                          <th>Price (Rs.)</th>
                          <th>Compare at</th>
                          <th>Stock</th>
                          <th>SKU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr key={`${v.color}-${v.size}-${idx}`}>
                            <td>
                              <button
                                type="button"
                                className="admin-variant-thumb"
                                onClick={() => cycleVariantImage(idx)}
                                title="Click to cycle through this product's images"
                              >
                                {v.image ? (
                                  <img src={v.image} alt="" />
                                ) : (
                                  <span className="admin-variant-thumb-empty">+</span>
                                )}
                              </button>
                            </td>
                            <td>
                              <div className="admin-variant-name">
                                {v.color && (
                                  <span
                                    className="admin-color-dot"
                                    style={{ background: colors.find(c => c.name === v.color)?.hex || '#ccc' }}
                                  />
                                )}
                                {[v.color, v.size].filter(Boolean).join(' / ') || 'Default'}
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                placeholder={formData.price || '—'}
                                value={v.price ?? ''}
                                onChange={e => updateVariant(idx, 'price', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                placeholder="—"
                                value={v.originalPrice ?? ''}
                                onChange={e => updateVariant(idx, 'originalPrice', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={e => handleVariantStockChange(idx, e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="—"
                                value={v.sku || ''}
                                onChange={e => updateVariant(idx, 'sku', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--gray)' }}>
                    Total stock: <strong style={{ color: 'var(--navy)' }}>{variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}</strong>
                    {' · '}
                    {variants.filter(v => v.image).length}/{variants.length} have a photo
                  </div>
                </div>
              )}

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
              <div className="admin-toggles-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <label className="admin-toggle-label">
                  <span className={`admin-toggle-switch ${formData.isFeatured ? 'on' : ''}`} onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}>
                    <span className="admin-toggle-knob"></span>
                  </span>
                  <span>Feature on Homepage (Top Row)</span>
                </label>
                <label className="admin-toggle-label">
                  <span className={`admin-toggle-switch ${formData.showInSoldOutRow ? 'on' : ''}`} onClick={() => setFormData({...formData, showInSoldOutRow: !formData.showInSoldOutRow})}>
                    <span className="admin-toggle-knob"></span>
                  </span>
                  <span>Feature in Sold Out Row</span>
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
                <label>
                  Images
                  <small style={{ fontWeight: 'normal', color: 'var(--gray)', marginLeft: 8 }}>
                    (Max 10MB each, up to {MAX_IMAGES}. The first image is the cover.)
                  </small>
                </label>

                <ImageManager
                  items={gallery}
                  onChange={handleGalleryChange}
                  max={MAX_IMAGES}
                  busy={saving}
                />

                <label className={`admin-image-add-btn ${preparing ? 'is-busy' : ''}`}>
                  {preparing || '+ Add Images'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePickImages}
                    disabled={!!preparing}
                    style={{ display: 'none' }}
                  />
                </label>

                <small style={{ color: 'var(--gray)', display: 'block', marginTop: 8 }}>
                  Removing a saved image deletes it permanently when you save.
                </small>
              </div>

              {error && (
                <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>
              )}

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
