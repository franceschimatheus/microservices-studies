import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { UserType } from '../schemas/authSchema';
import { useUserQuery } from '../queries/useUserQuery';
import { useLoginMutation } from '../queries/useLoginMutation';
import { useSignupMutation } from '../queries/useSignupMutation';
import { useLogoutMutation } from '../queries/useLogoutMutation';

export type { UserType as User };

export function useAuth() {
  const { user, setUser } = useAuthStore();

  const { data: queryUser, isLoading: queryLoading, error: queryError, refetch } = useUserQuery();
  const loginMutation = useLoginMutation();
  const signupMutation = useSignupMutation();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (queryUser !== undefined) {
      setUser(queryUser);
    }
  }, [queryUser, setUser]);

  const login = async (email: string, password: string): Promise<UserType> => {
    return loginMutation.mutateAsync({ email, password });
  };

  const signup = async (email: string, password: string, role: 'customer' | 'admin'): Promise<UserType> => {
    return signupMutation.mutateAsync({ email, password, role });
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  return {
    user: user || queryUser || null,
    loading: queryLoading,
    error: queryError ? (queryError as Error).message : (loginMutation.error ? (loginMutation.error as Error).message : null),
    login,
    signup,
    logout,
    checkSession: async () => {
      await refetch();
    },
  };
}
