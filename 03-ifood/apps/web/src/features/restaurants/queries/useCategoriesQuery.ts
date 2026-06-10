import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CategoryType, categorySchema } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useCategoriesQuery(restaurantId: string | null | undefined) {
  return useQuery<CategoryType[]>({
    queryKey: ['restaurants', restaurantId, 'categories'],
    queryFn: async () => {
      if (!restaurantId) return [];
      const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurantId}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return z.array(categorySchema).parse(data || []);
    },
    enabled: !!restaurantId,
  });
}
