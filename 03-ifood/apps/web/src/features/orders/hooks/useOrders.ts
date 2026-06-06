import { useState, useCallback } from 'react';
import { Order, OrderListSchema, OrderSchema } from '../schemas/orderSchema';

export type { Order, OrderItem, OrderStatus } from '../schemas/orderSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${GATEWAY_URL}/orders`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setOrders([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch orders');
      const raw = await res.json();
      const data = OrderListSchema.parse(Array.isArray(raw) ? raw : []);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Error loading orders');
      console.error('[useOrders] fetchOrders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = async (restaurantId: string): Promise<Order> => {
    const res = await fetch(`${GATEWAY_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to place order');
    }

    const raw = await res.json();
    const order = OrderSchema.parse(raw);
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  const getOrder = async (id: string): Promise<Order | null> => {
    try {
      const res = await fetch(`${GATEWAY_URL}/orders/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const raw = await res.json();
      return OrderSchema.parse(raw);
    } catch (err) {
      console.error('[useOrders] getOrder error:', err);
      return null;
    }
  };

  return { orders, loading, error, fetchOrders, placeOrder, getOrder };
}
