import { useQuery } from '@tanstack/react-query';
import { Order, OrderListSchema } from '../schemas/orderSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useOrdersQuery() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch(`${GATEWAY_URL}/orders`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        return [];
      }
      if (!res.ok) throw new Error('Failed to fetch orders');
      const raw = await res.json();
      return OrderListSchema.parse(Array.isArray(raw) ? raw : []);
    },
  });
}
