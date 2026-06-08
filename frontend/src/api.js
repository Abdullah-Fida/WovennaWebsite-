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
export const getUserOrders = async () => {
  const data = await apiFetch('/order/my-orders');
  return data.orders || data;
};
export const getOrderById = async (id) => {
  const data = await apiFetch(`/order/${id}`);
  return data.order || data;
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
