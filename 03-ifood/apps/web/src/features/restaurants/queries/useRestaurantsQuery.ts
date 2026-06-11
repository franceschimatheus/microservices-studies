import { useQuery } from '@tanstack/react-query';
import { RestaurantType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useRestaurantsQuery() {
  return useQuery<RestaurantType[]>({
    queryKey: ['restaurants'],
    queryFn: async () => {
      return await restaurantClient.getRestaurants();
    },
  });
}
