import { useAuthStore } from './store';
import type { AuthUser } from './store';

export function login(
  user: AuthUser,
  accessToken: string,
  refreshToken: string
) {
  useAuthStore.getState().setLoading(true);
  try {
    useAuthStore.getState().login(user, accessToken, refreshToken);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Login failed';
    useAuthStore.getState().setError(message);
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}

export function logout() {
  useAuthStore.getState().logout();
}

export async function initiateGitHubLogin() {
  try {
    // Redirect to backend OAuth endpoint
    window.location.href = '/api/v1/auth/github/login';
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to initiate login';
    useAuthStore.getState().setError(message);
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
    logout(); // Clear invalid session
    return null;
  } finally {
    setLoading(false);
  }
}

export async function logoutUser() {
  const { setLoading, setError } = useAuthStore.getState();

  setLoading(true);
  try {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Logout failed';
    setError(message);
  } finally {
    useAuthStore.getState().logout();
    setLoading(false);
  }
}
