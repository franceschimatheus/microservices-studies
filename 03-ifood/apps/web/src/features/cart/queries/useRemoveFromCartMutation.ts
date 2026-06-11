import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CartType } from '../schemas/cartSchema';
import { cartClient } from '../api/cartClient';

export function useRemoveFromCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      return await cartClient.removeItem(itemId);
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartType>(['cart']);

      if (previousCart) {
        const existingItems = previousCart.items || [];
        const updatedItems = existingItems.filter(i => i.menu_item_id !== itemId);
        const updatedTotalPrice = updatedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

        queryClient.setQueryData<CartType>(['cart'], {
          ...previousCart,
          items: updatedItems,
          total_price: updatedTotalPrice,
        });
      }

      return { previousCart };
    },
    onError: (err, itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
