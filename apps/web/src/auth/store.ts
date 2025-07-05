import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      login: (user: AuthUser, accessToken: string, refreshToken: string) =>
        set({ user, accessToken, refreshToken, isLoading: false, error: null }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
        }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
