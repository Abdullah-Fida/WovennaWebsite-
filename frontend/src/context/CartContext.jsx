import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  deleteCartItem as apiDeleteCartItem,
} from '../api';
import {
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  deleteGuestCartItem,
  clearGuestCart,
  cartLineKey,
} from '../guestCart';

const CartContext = createContext(null);

// The server stores one document per cart line; the id is what update/delete
// endpoints expect, while the guest cart is keyed by product+variant.
function lineKeyOf(item) {
  return item._id || cartLineKey(item);
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState(() => getGuestCart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mergedForUser = useRef(null);

  const isGuest = !user;

  const refresh = useCallback(async () => {
    if (!user) {
      setItems(getGuestCart());
      setError('');
      return;
    }
    setLoading(true);
    try {
      const data = await apiGetCart();
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // When a guest signs in, move their localStorage cart onto the account so
  // nothing they picked before logging in gets lost.
  const mergeGuestCart = useCallback(async () => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;
    for (const item of guestItems) {
      try {
        await apiAddToCart({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        });
      } catch (err) {
        console.error('Failed to merge guest cart item', item.name, err);
      }
    }
    clearGuestCart();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      mergedForUser.current = null;
      setItems(getGuestCart());
      return;
    }

    if (mergedForUser.current === user._id) {
      refresh();
      return;
    }

    mergedForUser.current = user._id;
    (async () => {
      setLoading(true);
      await mergeGuestCart();
      await refresh();
    })();
  }, [user, authLoading, mergeGuestCart, refresh]);

  const addItem = useCallback(
    async (item) => {
      const payload = {
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: Number(item.quantity) || 1,
        color: item.color || '',
        size: item.size || '',
      };

      if (!user) {
        setItems(addToGuestCart(payload));
        return;
      }

      await apiAddToCart(payload);
      await refresh();
    },
    [user, refresh]
  );

  const updateQty = useCallback(
    async (item, quantity) => {
      if (quantity < 1) return;
      if (isGuest) {
        setItems(updateGuestCartItem(cartLineKey(item), quantity));
        return;
      }
      await apiUpdateCartItem(lineKeyOf(item), { quantity });
      await refresh();
    },
    [isGuest, refresh]
  );

  const removeItem = useCallback(
    async (item) => {
      if (isGuest) {
        setItems(deleteGuestCartItem(cartLineKey(item)));
        return;
      }
      await apiDeleteCartItem(lineKeyOf(item));
      await refresh();
    },
    [isGuest, refresh]
  );

  // Called after an order is placed so the badge empties immediately.
  const resetCart = useCallback(() => {
    clearGuestCart();
    setItems([]);
  }, []);

  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        loading,
        error,
        isGuest,
        addItem,
        updateQty,
        removeItem,
        refresh,
        resetCart,
        lineKeyOf,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
