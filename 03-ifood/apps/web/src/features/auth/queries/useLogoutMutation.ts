import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';

const GATEWAY_URL = 'http://localhost:8085';

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await fetch(`${GATEWAY_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['user'], null);
      queryClient.clear(); // Clear all query caches on sign out
    },
  });
}
