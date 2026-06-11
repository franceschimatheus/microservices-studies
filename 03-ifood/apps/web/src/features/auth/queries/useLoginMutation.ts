import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { authClient } from '../api/authClient';
import { LoginFormType, UserType } from '../schemas/authSchema';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: LoginFormType): Promise<UserType> => {
      return await authClient.login(data);
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(['user'], userData);
    },
  });
}
