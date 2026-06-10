import { useQuery } from '@tanstack/react-query';
import { Cart, CartSchema } from '../schemas/cartSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useCartQuery() {
  return useQuery<Cart | null>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await fetch(`${GATEWAY_URL}/cart`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      return CartSchema.parse(data);
    },
  });
}
