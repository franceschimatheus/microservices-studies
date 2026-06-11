import { useQuery } from '@tanstack/react-query';
import { CartType } from '../schemas/cartSchema';
import { cartClient } from '../api/cartClient';

export function useCartQuery() {
  return useQuery<CartType | null>({
    queryKey: ['cart'],
    queryFn: async () => {
      return await cartClient.getCart();
    },
  });
}

