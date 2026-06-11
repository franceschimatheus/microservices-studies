import { useQuery } from '@tanstack/react-query';
import { CategoryType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useCategoriesQuery(restaurantId: string | null) {
  return useQuery<CategoryType[]>({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      return await restaurantClient.getCategories(restaurantId);
    },
    enabled: !!restaurantId,
  });
}
