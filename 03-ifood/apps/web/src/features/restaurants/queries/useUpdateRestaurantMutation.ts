import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RestaurantFormType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useUpdateRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RestaurantFormType }) => {
      return await restaurantClient.updateRestaurant(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}
