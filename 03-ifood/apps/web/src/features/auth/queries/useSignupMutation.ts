import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { authClient } from '../api/authClient';
import { SignupFormType, UserType } from '../schemas/authSchema';

export function useSignupMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: SignupFormType): Promise<UserType> => {
      return await authClient.signup(data);
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.setQueryData(['user'], userData);
    },
  });
}
