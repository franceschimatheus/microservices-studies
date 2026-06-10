import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuItemSchema, MenuItemFormType } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useCreateMenuItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, ...payload }: MenuItemFormType & { categoryId: string }) => {
      const res = await fetch(`${GATEWAY_URL}/menu-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          ...payload,
        }),
      });
      if (!res.ok) throw new Error('Failed to create menu item');
      const data = await res.json();
      return menuItemSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'menu'] });
    },
  });
}
