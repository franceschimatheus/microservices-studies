import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemFormType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useCreateMenuItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MenuItemFormType & { category_id: string }) => {
      return await restaurantClient.createMenuItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
    },
  });
}
