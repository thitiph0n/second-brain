// Authentication Components
export { LoginCard, LoginButton } from './components/LoginCard';
export { UserMenu } from './components/UserMenu';
export { AuthGuard, RequireAuth } from './components/AuthGuard';
export { AuthStatus, LoadingSpinner } from './components/AuthStatus';
export { AuthProvider } from './components/AuthProvider';

// Authentication Hooks
export { useAuth, useAuthActions } from './hooks';

// Authentication Actions
export {
  login,
  logout,
  initiateGitHubLogin,
  refreshToken,
  logoutUser,
} from './actions';

// Authentication API
export { fetchMe, refreshToken as refreshTokenAPI } from './api';

// Authentication Utils
export {
  initializeAuth,
  setupTokenRefresh,
  handleOAuthCallback,
} from './utils';

// Authentication Types
export type { AuthUser, AuthState } from './store';
