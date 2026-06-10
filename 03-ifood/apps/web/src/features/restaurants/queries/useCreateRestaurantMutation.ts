import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RestaurantFormType, RestaurantType, restaurantSchema } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useCreateRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RestaurantFormType): Promise<RestaurantType> => {
      const res = await fetch(`${GATEWAY_URL}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create restaurant');
      const data = await res.json();
      return restaurantSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}
