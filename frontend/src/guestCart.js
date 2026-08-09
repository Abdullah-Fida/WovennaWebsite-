// Utility for managing a guest (localStorage) cart
// Used when the user is not logged in

const CART_KEY = 'wovenaa_guest_cart';

// Items are identified by product + chosen variant, so the same bag in two
// colors stays as two separate lines.
export function cartLineKey(item) {
  return [item.productId, item.color || '', item.size || ''].join('::');
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function getGuestCart() {
  return readCart();
}

export function addToGuestCart(item) {
  const cart = readCart();
  const key = cartLineKey(item);
  const idx = cart.findIndex((i) => cartLineKey(i) === key);
  const qty = Number(item.quantity) || 1;

  if (idx >= 0) {
    cart[idx].quantity += qty;
  } else {
    cart.push({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      color: item.color || '',
      size: item.size || '',
      quantity: qty,
    });
  }
  return writeCart(cart);
}

export function updateGuestCartItem(key, quantity) {
  const cart = readCart();
  const idx = cart.findIndex((i) => cartLineKey(i) === key);
  if (idx >= 0) {
    if (quantity < 1) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = quantity;
    }
    writeCart(cart);
  }
  return readCart();
}

export function deleteGuestCartItem(key) {
  return writeCart(readCart().filter((i) => cartLineKey(i) !== key));
}

export function clearGuestCart() {
  localStorage.removeItem(CART_KEY);
  return [];
}

export function getGuestCartCount() {
  return readCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}
