import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { MenuItemType, menuItemSchema } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useMenuQuery(restaurantId: string | null | undefined) {
  return useQuery<MenuItemType[]>({
    queryKey: ['restaurants', restaurantId, 'menu'],
    queryFn: async () => {
      if (!restaurantId) return [];
      const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurantId}/menu`);
      if (!res.ok) throw new Error('Failed to fetch menu');
      const data = await res.json();
      return z.array(menuItemSchema).parse(data || []);
    },
    enabled: !!restaurantId,
  });
}
