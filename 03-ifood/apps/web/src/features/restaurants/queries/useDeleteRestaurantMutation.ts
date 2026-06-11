import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantClient } from '../api/restaurantClient';

export function useDeleteRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await restaurantClient.deleteRestaurant(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

