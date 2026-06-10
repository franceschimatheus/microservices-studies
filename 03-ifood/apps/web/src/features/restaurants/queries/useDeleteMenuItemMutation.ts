import { useMutation, useQueryClient } from '@tanstack/react-query';

const GATEWAY_URL = 'http://localhost:8085';

export function useDeleteMenuItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${GATEWAY_URL}/menu-items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete menu item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'menu'] });
    },
  });
}
