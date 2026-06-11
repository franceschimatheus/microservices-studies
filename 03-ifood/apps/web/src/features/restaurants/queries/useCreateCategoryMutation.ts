import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryFormType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useCreateCategoryMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CategoryFormType) => {
      return await restaurantClient.createCategory(restaurantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
    },
  });
}
