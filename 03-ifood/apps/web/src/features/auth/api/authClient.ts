import { LoginFormType, SignupFormType, UserType, userSchema } from '../schemas/authSchema';
import { _get, _post } from '@/services/api';

export const authClient = {
  login: async (data: LoginFormType): Promise<UserType> => {
    const res = await _post('/auth/signin', data);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }
    const sessionRes = await _get('/auth/me');
    if (!sessionRes.ok) throw new Error('Failed to retrieve user details');
    const sessionData = await sessionRes.json();
    return userSchema.parse(sessionData);
  },

  signup: async (data: SignupFormType): Promise<UserType> => {
    const res = await _post('/auth/signup', data);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Signup failed');
    }
    const sessionRes = await _get('/auth/me');
    if (!sessionRes.ok) throw new Error('Failed to retrieve user details');
    const sessionData = await sessionRes.json();
    return userSchema.parse(sessionData);
  },

  logout: async (): Promise<void> => {
    await _post('/auth/signout');
  },

  me: async (): Promise<UserType | null> => {
    try {
      const sessionRes = await _get('/auth/me');
      if (!sessionRes.ok) return null;
      const sessionData = await sessionRes.json();
      return userSchema.parse(sessionData);
    } catch {
      return null;
    }
  },
};

