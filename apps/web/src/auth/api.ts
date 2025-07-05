import { useAuthStore } from './store';

export async function fetchMe() {
  useAuthStore.getState().setLoading(true);
  useAuthStore.getState().setError(null);
  try {
    const res = await fetch('/api/v1/auth/me', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const data = await res.json();
    // Assume API returns { user, accessToken, refreshToken }
    useAuthStore
      .getState()
      .login(data.user, data.accessToken, data.refreshToken);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch user';
    useAuthStore.getState().setError(message);
    // Don't auto-logout on fetch errors to preserve persisted state
    // Only logout if explicitly called by user or on auth-specific errors
    throw e;
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

export async function refreshToken() {
  const {
    refreshToken: token,
    setLoading,
    setError,
    logout,
  } = useAuthStore.getState();

  if (!token) {
    logout();
    return null;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: token }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    useAuthStore
      .getState()
      .login(data.user, data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Token refresh failed';
    setError(message);
    logout();
    return null;
  } finally {
    setLoading(false);
  }
}
