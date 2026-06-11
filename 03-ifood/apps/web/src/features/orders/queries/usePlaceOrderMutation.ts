import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderType } from '../schemas/orderSchema';
import { orderClient } from '../api/orderClient';

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (restaurantId: string) => {
      return await orderClient.placeOrder(restaurantId);
    },
    onSuccess: (newOrder) => {
      queryClient.setQueryData<OrderType[]>(['orders'], (oldOrders = []) => [newOrder, ...oldOrders]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
