import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RestaurantFormType, RestaurantType, restaurantSchema } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useUpdateRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RestaurantFormType }): Promise<RestaurantType> => {
      const res = await fetch(`${GATEWAY_URL}/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update restaurant');
      const resData = await res.json();
      return restaurantSchema.parse(resData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}
