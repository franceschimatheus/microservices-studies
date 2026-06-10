import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderSchema } from '../schemas/orderSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (restaurantId: string) => {
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
      return OrderSchema.parse(raw);
    },
    onSuccess: (newOrder) => {
      queryClient.setQueryData<Order[]>(['orders'], (oldOrders = []) => [newOrder, ...oldOrders]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
