import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CartType, AddItemType } from '../schemas/cartSchema';
import { cartClient } from '../api/cartClient';

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: AddItemType) => {
      return await cartClient.addItem(item);
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartType>(['cart']);

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

        queryClient.setQueryData<CartType>(['cart'], {
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
