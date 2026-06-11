import { useQuery } from '@tanstack/react-query';
import { MenuItemType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useMenuQuery(restaurantId: string | null) {
  return useQuery<MenuItemType[]>({
    queryKey: ['menu', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      return await restaurantClient.getMenu(restaurantId);
    },
    enabled: !!restaurantId,
  });
}
