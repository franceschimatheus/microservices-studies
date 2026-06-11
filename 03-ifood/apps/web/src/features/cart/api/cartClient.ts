import { _get, _post, _delete } from '@/services/api';
import { cartSchema, CartType, AddItemType } from '../schemas/cartSchema';

export const cartClient = {
  getCart: async (): Promise<CartType | null> => {
    const res = await _get('/cart');
    if (res.status === 401) return null;
    const data = await res.json();
    return cartSchema.parse(data);
  },

  addItem: async (item: AddItemType): Promise<CartType> => {
    const res = await _post('/cart/items', item);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add item to cart');
    }
    const data = await res.json();
    return cartSchema.parse(data);
  },

  removeItem: async (itemId: string): Promise<CartType> => {
    const res = await _delete(`/cart/items/${itemId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove item from cart');
    }
    const data = await res.json();
    return cartSchema.parse(data);
  },

  clearCart: async (): Promise<void> => {
    const res = await _delete('/cart');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to clear cart');
    }
  },
};
