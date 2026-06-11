import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { authClient } from '../api/authClient';

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await authClient.logout();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['user'], null);
      queryClient.clear(); // Clear all query caches on sign out
    },
  });
}
