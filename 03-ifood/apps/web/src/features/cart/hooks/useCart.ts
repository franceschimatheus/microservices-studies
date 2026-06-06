import { useState, useEffect, useCallback } from 'react';
import { Cart, CartSchema, AddItemData } from '../schemas/cartSchema';

export type { CartItem, Cart, AddItemData } from '../schemas/cartSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${GATEWAY_URL}/cart`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setCart(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setCart(CartSchema.parse(data));
    } catch (err: any) {
      setError(err.message || 'Error loading cart');
      console.error('[useCart] fetchCart error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = async (item: AddItemData) => {
    try {
      setError(null);
      const res = await fetch(`${GATEWAY_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add item to cart');
      await fetchCart();
    } catch (err: any) {
      setError(err.message || 'Error adding item');
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setError(null);
      const res = await fetch(`${GATEWAY_URL}/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove item from cart');
      await fetchCart();
    } catch (err: any) {
      setError(err.message || 'Error removing item');
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const res = await fetch(`${GATEWAY_URL}/cart`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to clear cart');
      setCart(null);
    } catch (err: any) {
      setError(err.message || 'Error clearing cart');
      throw err;
    }
  };

  /**
   * Checkout: delegates to the caller, who must provide restaurantId and
   * call POST /orders themselves (via useOrders.placeOrder). This hook
   * only provides clearCart so the cart is flushed after the order succeeds.
   */
  const checkout = async (restaurantId: string, placeOrderFn: (id: string) => Promise<unknown>) => {
    await placeOrderFn(restaurantId);
    // Cart is cleared server-side by the order-service handler; sync locally.
    setCart(null);
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    loading,
    error,
    fetchCart,
    addItem,
    removeItem,
    clearCart,
    checkout,
  };
}
