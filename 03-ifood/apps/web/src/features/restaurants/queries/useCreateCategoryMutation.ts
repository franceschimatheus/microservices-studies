import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categorySchema, CategoryFormType } from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useCreateCategoryMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryFormType) => {
      const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurantId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create category');
      const data = await res.json();
      return categorySchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'categories'] });
    },
  });
}
