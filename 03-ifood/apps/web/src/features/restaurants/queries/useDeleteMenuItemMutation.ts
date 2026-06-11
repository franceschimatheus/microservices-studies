import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantClient } from '../api/restaurantClient';

export function useDeleteMenuItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await restaurantClient.deleteMenuItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
    },
  });
}

