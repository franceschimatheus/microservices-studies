import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemFormType } from '../schemas';
import { restaurantClient } from '../api/restaurantClient';

export function useUpdateMenuItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MenuItemFormType & { category_id: string } }) => {
      return await restaurantClient.updateMenuItem(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
    },
  });
}
