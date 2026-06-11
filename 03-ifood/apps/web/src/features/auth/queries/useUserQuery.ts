import { useQuery } from '@tanstack/react-query';
import { UserType } from '../schemas/authSchema';
import { authClient } from '../api/authClient';

export function useUserQuery() {
  return useQuery<UserType | null>({
    queryKey: ['user'],
    queryFn: async () => {
      return await authClient.me();
    },
    staleTime: 5 * 60 * 1000, // Keep user session cached for 5 minutes
  });
}
