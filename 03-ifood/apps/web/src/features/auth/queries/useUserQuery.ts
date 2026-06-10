import { useQuery } from '@tanstack/react-query';
import { User } from '../store/useAuthStore';

const GATEWAY_URL = 'http://localhost:8085';

export function useUserQuery() {
  return useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch(`${GATEWAY_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        return null;
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Keep user session cached for 5 minutes
  });
}
