import { useMutation, useQueryClient } from '@tanstack/react-query';
import { architectureClient } from '../api/architectureClient';

export function useToggleServiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, action }: { name: string; action: 'start' | 'stop' }) => {
      return await architectureClient.toggleServiceState(name, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceStatuses'] });
    },
  });
}
