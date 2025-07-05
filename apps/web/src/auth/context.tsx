import { createContext } from 'react';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
};

export const AuthContext = createContext<
  (AuthState & { logout: () => Promise<void> }) | undefined
>(undefined);
