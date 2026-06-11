import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RestaurantType, RestaurantFormType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useCreateRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RestaurantFormType): Promise<RestaurantType> => {
      return await restaurantClient.createRestaurant(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}
