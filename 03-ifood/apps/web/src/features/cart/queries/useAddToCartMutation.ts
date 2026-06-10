import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Cart, AddItemData } from '../schemas/cartSchema';

const GATEWAY_URL = 'http://localhost:8085';

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: AddItemData) => {
      const res = await fetch(`${GATEWAY_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add item to cart');
      return res.json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      if (previousCart) {
        const existingItems = previousCart.items || [];
        const existingItemIndex = existingItems.findIndex(i => i.menu_item_id === newItem.menu_item_id);
        const updatedItems = [...existingItems];

        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
          };
        } else {
          updatedItems.push({
            menu_item_id: newItem.menu_item_id,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity,
          });
        }

        const updatedTotalPrice = updatedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

        queryClient.setQueryData<Cart>(['cart'], {
          ...previousCart,
          restaurant_id: newItem.restaurant_id,
          items: updatedItems,
          total_price: updatedTotalPrice,
        });
      }

      return { previousCart };
    },
    onError: (err, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
