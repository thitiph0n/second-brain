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
  const store = useAuthStore.getState();
  
  // Manually hydrate the store from localStorage since we're using skipHydration
  const persistedState = localStorage.getItem('auth-storage');
  if (persistedState) {
    try {
      const { state } = JSON.parse(persistedState);
      if (state.user && state.accessToken && state.refreshToken) {
        // Restore the persisted auth state
        store.login(state.user, state.accessToken, state.refreshToken);
        console.log('Restored persisted auth state');
        
        // Optional: validate session in background without logging out on failure
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (state.accessToken) {
          headers.Authorization = `Bearer ${state.accessToken}`;
        }
        
        fetch('/api/v1/auth/me', {
          credentials: 'include',
          headers,
        }).then(async (response) => {
          if (response.ok) {
            const userData = await response.json();
            // Map snake_case to camelCase for avatarUrl
            const { avatar_url, ...rest } = userData;
            const mappedUser = {
              ...rest,
              avatarUrl: avatar_url || userData.avatarUrl,
            };
            useAuthStore.getState().login(mappedUser, state.accessToken, state.refreshToken);
          } else if (response.status === 401) {
            // Try to refresh token in background
            refreshToken().catch(() => {
              console.log('Token refresh failed, keeping persisted state');
            });
          }
        }).catch(() => {
          console.log('Session validation failed, keeping persisted state');
        });
        
        store.setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Failed to restore persisted auth state:', e);
    }
  }
  
  // No persisted state - check if server has an active session via cookies
  // Only make the /me call if there might be an active session
  store.setLoading(true);
  try {
    // Check if we have any auth-related cookies that might indicate an active session
    const hasAuthCookies = document.cookie.includes('session') || 
                          document.cookie.includes('token') || 
                          document.cookie.includes('auth');
    
    if (hasAuthCookies) {
      // Only call /me if we have potential session cookies
      await fetchMe();
    } else {
      // No cookies, no persisted state - user is definitely not authenticated
      console.log('No auth cookies found, skipping /me call');
    }
  } catch (e) {
    console.log('No active session found');
  } finally {
    store.setLoading(false);
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
