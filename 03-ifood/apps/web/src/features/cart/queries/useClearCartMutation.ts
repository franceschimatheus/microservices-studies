import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CartType } from '../schemas/cartSchema';
import { cartClient } from '../api/cartClient';

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await cartClient.clearCart();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartType>(['cart']);

      queryClient.setQueryData<CartType | null>(['cart'], null);

      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
