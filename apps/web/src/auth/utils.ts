import { useAuthStore } from './store';
import { fetchMe, refreshToken } from './api';

// Auto-refresh token when it's about to expire
export function setupTokenRefresh() {
  const checkTokenExpiry = () => {
    const { accessToken, refreshToken: refresh } = useAuthStore.getState();

    if (!accessToken || !refresh) return;

    try {
      // Decode JWT to check expiry (simple implementation)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - now;

      // Refresh if token expires in less than 5 minutes
      if (timeUntilExpiry < 300) {
        refreshToken();
      }
    } catch (e) {
      console.error('Failed to parse token:', e);
    }
  };

  // Check token expiry every minute
  return setInterval(checkTokenExpiry, 60000);
}

// Initialize auth state on app load
export async function initializeAuth() {
  const { setLoading } = useAuthStore.getState();

  setLoading(true);
  try {
    // Try to get current user session
    await fetchMe();
  } catch (e) {
    // Silent fail - user not authenticated
    console.log('No active session');
  } finally {
    setLoading(false);
  }
}

// Handle OAuth callback (call this on callback page)
export function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  if (error) {
    const errorDescription =
      urlParams.get('error_description') || 'OAuth login failed';
    useAuthStore.getState().setError(errorDescription);
    return;
  }

  // If no error, fetch user profile to complete login
  fetchMe().then(() => {
    // Redirect to intended destination or home
    const redirectTo = sessionStorage.getItem('auth_redirect') || '/';
    sessionStorage.removeItem('auth_redirect');
    window.location.href = redirectTo;
  });
}
