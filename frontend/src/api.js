const API_BASE = import.meta.env.VITE_API_BASE
  ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, '')
  : '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  // Attach token as Authorization header (needed for cross-origin deployments
  // where cookies are blocked by the browser)
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
    config.body = options.body;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  // Some errors (like the server being down) may return non-JSON responses.
  // Avoid crashing the frontend with "Unexpected end of JSON input".
  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw || 'Unexpected server response' };
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth
export const registerUser = (body) => apiFetch('/users/register', { method: 'POST', body });
export const loginUser = (body) => apiFetch('/users/login', { method: 'POST', body });
export const logoutUser = () => apiFetch('/users/logout', { method: 'POST' });
export const verifyAuth = () => apiFetch('/users/verify');
export const getProfile = () => apiFetch('/users/me');
export const updateProfile = (body) => apiFetch('/users/profile', { method: 'PUT', body });

// Products (public)
export const getProducts = (query = '') => apiFetch(`/products${query ? '?' + query : ''}`);
export const getProduct = (id) => apiFetch(`/products/${id}`);

// Cart
export const getCart = () => apiFetch('/cart');
export const addToCart = (body) => apiFetch('/cart/add', { method: 'POST', body });
export const updateCartItem = (productId, body) => apiFetch(`/cart/${productId}`, { method: 'PUT', body });
export const deleteCartItem = (productId) => apiFetch(`/cart/${productId}`, { method: 'DELETE' });
export const clearCart = () => apiFetch('/cart/clear', { method: 'DELETE' });

// Orders
export const createOrder = async (body) => {
  const data = await apiFetch('/order/create', { method: 'POST', body });
  return data.order || data;
};
export const createGuestOrder = async (body) => {
  const data = await apiFetch('/order/guest-create', { method: 'POST', body });
  return data.order || data;
};
export const getUserOrders = async () => {
  const data = await apiFetch('/order/my-orders');
  return data.orders || data;
};
export const getOrderById = async (id) => {
  const data = await apiFetch(`/order/${id}`);
  return data.order || data;
};
export const trackOrder = async (body) => {
  const data = await apiFetch('/order/track', { method: 'POST', body });
  return { order: data.order, orders: data.orders || (data.order ? [data.order] : []) };
};

// Admin
export const getAdminStats = () => apiFetch('/admin/stats');
export const getAdminUsers = () => apiFetch('/admin/users');
export const getAdminProducts = () => apiFetch('/admin/products');
export const getAdminProduct = (id) => apiFetch(`/admin/products/${id}`);
export const createProduct = (formData) => apiFetch('/admin/products', { method: 'POST', body: formData });
export const updateProduct = (id, formData) => apiFetch(`/admin/products/${id}`, { method: 'PUT', body: formData });
export const deleteProduct = (id) => apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
export const getAdminOrders = async () => {
  const data = await apiFetch('/admin/orders');
  return data.orders || data;
};
export const updateOrderStatus = (id, status) => apiFetch(`/admin/orders/${id}/status`, { method: 'PUT', body: { status } });
export const toggleUserStatus = (id) => apiFetch(`/admin/users/${id}/toggle-status`, { method: 'PUT' });

// Contact
export const submitContactQuery = (body) => apiFetch('/contact', { method: 'POST', body });

// Promos (Admin)
export const getAdminPromos = () => apiFetch('/admin/promos');
export const createPromo = (body) => apiFetch('/admin/promos', { method: 'POST', body });
export const updatePromo = (id, body) => apiFetch(`/admin/promos/${id}`, { method: 'PUT', body });
export const deletePromo = (id) => apiFetch(`/admin/promos/${id}`, { method: 'DELETE' });

// Promos (Public)
export const validatePromoCode = (body) => apiFetch('/promos/validate', { method: 'POST', body });


// Influencer program (public)
export const getGalleryPosts = async () => {
  const data = await apiFetch('/influencers/gallery');
  return data.posts || [];
};
export const validateReferralCode = async (code) => {
  const data = await apiFetch(`/influencers/referral/${encodeURIComponent(code)}`);
  return data.referral;
};

// Influencer program (member)
export const getMyInfluencer = () => apiFetch('/influencers/me');
export const applyAsInfluencer = (body) => apiFetch('/influencers/apply', { method: 'POST', body });
export const updateMyInfluencer = (body) => apiFetch('/influencers/me', { method: 'PUT', body });
export const getMyInfluencerOrders = async () => {
  const data = await apiFetch('/influencers/me/orders');
  return data.orders || [];
};
export const getMyGalleryPosts = async () => {
  const data = await apiFetch('/influencers/me/posts');
  return data.posts || [];
};
export const createMyGalleryPost = (formData) =>
  apiFetch('/influencers/me/posts', { method: 'POST', body: formData });
export const deleteMyGalleryPost = (id) =>
  apiFetch(`/influencers/me/posts/${id}`, { method: 'DELETE' });

// Influencer program (admin)
export const getAdminInfluencers = async (status = 'all') => {
  const data = await apiFetch(`/admin/influencers?status=${status}`);
  return data.influencers || [];
};
export const setInfluencerStatus = (id, body) =>
  apiFetch(`/admin/influencers/${id}/status`, { method: 'PUT', body });
export const recordInfluencerPayout = (id, amount) =>
  apiFetch(`/admin/influencers/${id}/payout`, { method: 'POST', body: { amount } });
export const getAdminGalleryPosts = async (status = 'all') => {
  const data = await apiFetch(`/admin/gallery?status=${status}`);
  return data.posts || [];
};
export const setGalleryPostStatus = (id, body) =>
  apiFetch(`/admin/gallery/${id}`, { method: 'PUT', body });
export const deleteAdminGalleryPost = (id) =>
  apiFetch(`/admin/gallery/${id}`, { method: 'DELETE' });
