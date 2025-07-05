import { useAuthStore } from './store';

export async function fetchMe() {
  useAuthStore.getState().setLoading(true);
  useAuthStore.getState().setError(null);
  try {
    const { accessToken, refreshToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch('/api/v1/auth/me', {
      credentials: 'include',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const userData = await res.json();
    // Map snake_case to camelCase for avatarUrl
    const { avatar_url, ...rest } = userData;
    const mappedUser = {
      ...rest,
      avatarUrl: avatar_url || userData.avatarUrl,
    };
    // API only returns user data, keep existing tokens
    useAuthStore.getState().login(mappedUser, accessToken!, refreshToken!);
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
    accessToken,
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
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ refresh_token: token }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const currentUser = useAuthStore.getState().user;

    // API returns access_token and refresh_token, but we need to keep the user
    useAuthStore
      .getState()
      .login(currentUser!, data.access_token, data.refresh_token);
    return data.access_token;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Token refresh failed';
    setError(message);
    logout();
    return null;
  } finally {
    setLoading(false);
  }
}
