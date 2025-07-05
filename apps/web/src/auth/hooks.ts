import { useAuthStore } from './store';

// Custom hook for authentication state
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const accessToken = useAuthStore((state) => state.accessToken);

  const isAuthenticated = !!user && !!accessToken;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
  };
}

// Custom hook for authentication actions
export function useAuthActions() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);

  return {
    login,
    logout,
    setLoading,
    setError,
  };
}
