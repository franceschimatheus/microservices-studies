import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, useAuthStore } from '../store/useAuthStore';

const GATEWAY_URL = 'http://localhost:8085';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }): Promise<User> => {
      const res = await fetch(`${GATEWAY_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const sessionRes = await fetch(`${GATEWAY_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!sessionRes.ok) {
        throw new Error('Failed to retrieve user details');
      }
      return sessionRes.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(['user'], userData);
    },
  });
}
