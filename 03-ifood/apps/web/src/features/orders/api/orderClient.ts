import { _get, _post } from '@/services/api';
import { orderListSchema, orderSchema, OrderType } from '../schemas/orderSchema';

export const orderClient = {
  getOrders: async (): Promise<OrderType[]> => {
    const res = await _get('/orders');
    if (res.status === 401) return [];
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch orders');
    }
    const data = await res.json();
    return orderListSchema.parse(data);
  },

  placeOrder: async (restaurantId: string): Promise<OrderType> => {
    const res = await _post('/orders', { restaurant_id: restaurantId });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }
    const data = await res.json();
    return orderSchema.parse(data);
  },
};
