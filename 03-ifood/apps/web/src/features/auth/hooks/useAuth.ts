import { useState, useEffect, useCallback } from 'react';

const GATEWAY_URL = 'http://localhost:8085';

export interface User {
  user_id: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GATEWAY_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      setError('Connection error trying to reach server');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
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
      const userData = await sessionRes.json();
      setUser(userData);
      return userData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, role: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GATEWAY_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await fetch(`${GATEWAY_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    checkSession: fetchUser,
  };
}
