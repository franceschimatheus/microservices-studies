import { create } from 'zustand';

import { UserType } from '../schemas/authSchema';
interface AuthState {
  user: UserType | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserType | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const GATEWAY_URL = 'http://localhost:8085';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${GATEWAY_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null, error: 'Connection error trying to reach server' });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await fetch(`${GATEWAY_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      set({ user: null, loading: false });
    }
  },
}));
