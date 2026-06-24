// Utility for managing a guest (localStorage) cart
// Used when the user is not logged in

const CART_KEY = 'wovenaa_guest_cart';

export function getGuestCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToGuestCart(item) {
  const cart = getGuestCart();
  const idx = cart.findIndex(i => i.productId === item.productId);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity || 1;
  } else {
    cart.push({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity || 1,
    });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function updateGuestCartItem(productId, quantity) {
  const cart = getGuestCart();
  const idx = cart.findIndex(i => i.productId === productId);
  if (idx >= 0) {
    cart[idx].quantity = quantity;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  return cart;
}

export function deleteGuestCartItem(productId) {
  let cart = getGuestCart();
  cart = cart.filter(i => i.productId !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function clearGuestCart() {
  localStorage.removeItem(CART_KEY);
  return [];
}

export function getGuestCartCount() {
  const cart = getGuestCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
