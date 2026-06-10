import { useMutation } from '@tanstack/react-query';

const GATEWAY_URL = 'http://localhost:8085';

export function useSignupMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; role: string }): Promise<void> => {
      const res = await fetch(`${GATEWAY_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
    },
  });
}
