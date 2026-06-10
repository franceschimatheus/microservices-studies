import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuItemSchema, MenuItemFormType } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useUpdateMenuItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MenuItemFormType }) => {
      const res = await fetch(`${GATEWAY_URL}/menu-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update menu item');
      const resData = await res.json();
      return menuItemSchema.parse(resData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'menu'] });
    },
  });
}
