import { useQuery } from '@tanstack/react-query';
import { OrderType } from '../schemas/orderSchema';
import { orderClient } from '../api/orderClient';

export function useOrdersQuery() {
  return useQuery<OrderType[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      return await orderClient.getOrders();
    },
    refetchInterval: 5000,
  });
}
