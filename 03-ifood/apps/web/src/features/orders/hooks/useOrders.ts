import { useState, useCallback, useEffect } from 'react';
import { Order, OrderListSchema, OrderSchema } from '../schemas/orderSchema';
import { useToast } from '@/components/ui/Toast';

export type { Order, OrderItem, OrderStatus } from '../schemas/orderSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[useOrders] Connecting to real-time status stream...');
    const eventSource = new EventSource(`${GATEWAY_URL}/orders/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[useOrders] SSE event received:', message);

        if (message.type === 'ORDER_CREATED') {
          toast(`Order #${message.payload.order_id.slice(0, 8)} placed successfully.`, 'info', 'Order Placed');
          fetchOrders();
        } else if (message.type === 'ORDER_STATUS_UPDATED') {
          const payload = message.payload;
          
          let type: 'success' | 'error' | 'info' | 'warning' = 'info';
          if (payload.status === 'CONFIRMED' || payload.status === 'DELIVERED') {
            type = 'success';
          } else if (payload.status === 'CANCELLED') {
            type = 'error';
          } else {
            type = 'warning';
          }
          
          toast(`Order #${payload.order_id.slice(0, 8)} status updated to ${payload.status}.`, type, 'Order Status');
          
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.order_id ? { ...o, status: payload.status } : o
            )
          );
        }
      } catch (err) {
        console.error('[useOrders] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[useOrders] SSE connection error/closed:', err);
    };

    return () => {
      console.log('[useOrders] Closing real-time status stream...');
      eventSource.close();
    };
  }, [fetchOrders, toast]);

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
