import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Cart } from '../schemas/cartSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useRemoveFromCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`${GATEWAY_URL}/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove item from cart');
      return res.json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      if (previousCart) {
        const existingItems = previousCart.items || [];
        const updatedItems = existingItems.filter(i => i.menu_item_id !== itemId);
        const updatedTotalPrice = updatedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

        queryClient.setQueryData<Cart>(['cart'], {
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
