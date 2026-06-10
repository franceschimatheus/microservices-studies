import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { RestaurantType, restaurantSchema } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useRestaurantsQuery() {
  return useQuery<RestaurantType[]>({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await fetch(`${GATEWAY_URL}/restaurants`);
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      return z.array(restaurantSchema).parse(data || []);
    },
  });
}
