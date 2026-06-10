import { useMutation, useQueryClient } from '@tanstack/react-query';

const GATEWAY_URL = 'http://localhost:8085';

export function useDeleteRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${GATEWAY_URL}/restaurants/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete restaurant');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}
