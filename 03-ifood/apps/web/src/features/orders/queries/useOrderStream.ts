import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../schemas/orderSchema';
import { useToast } from '@/components/ui/Toast';

const GATEWAY_URL = 'http://localhost:8085';

export function useOrderStream() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[useOrderStream] Connecting to real-time status stream...');
    const eventSource = new EventSource(`${GATEWAY_URL}/orders/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[useOrderStream] SSE event received:', message);

        if (message.type === 'ORDER_CREATED') {
          toast(`Order #${message.payload.order_id.slice(0, 8)} placed successfully.`, 'info', 'Order Placed');
          queryClient.invalidateQueries({ queryKey: ['orders'] });
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
          
          queryClient.setQueryData<Order[]>(['orders'], (oldOrders = []) =>
            oldOrders.map((o) =>
              o.id === payload.order_id ? { ...o, status: payload.status } : o
            )
          );
        }
      } catch (err) {
        console.error('[useOrderStream] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[useOrderStream] SSE connection error/closed:', err);
    };

    return () => {
      console.log('[useOrderStream] Closing real-time status stream...');
      eventSource.close();
    };
  }, [queryClient, toast]);
}
