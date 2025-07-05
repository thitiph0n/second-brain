// Authentication routes for OAuth 2.1 GitHub integration

import { Hono } from 'hono';
import { GitHubOAuthService } from '../services/oauth';
import { AuthService } from '../services/auth';
import { createRateLimiter, requireAuth } from '../middleware/auth';
import { User, AuthSession } from '../types/auth';
import {
  validateUserProfile,
  validateTokenRefresh,
} from '../validation/auth';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ENVIRONMENT: string;
  FRONTEND_URL: string;
}

const auth = new Hono<{ Bindings: Env; Variables: { user: User; session: AuthSession } }>();

// Rate limiting for auth endpoints
const authRateLimit = createRateLimiter(10, 60000); // 10 requests per minute

// GitHub OAuth login initiation
auth.get('/github/login', authRateLimit, async (c) => {
  try {
    const redirectUri = `${c.req.url.split('/auth')[0]}/auth/github/callback`;

    const oauthService = new GitHubOAuthService(
      c.env.GITHUB_CLIENT_ID,
      c.env.GITHUB_CLIENT_SECRET,
      redirectUri
    );

    const { url, state } = oauthService.generateAuthUrl();

    // Store OAuth state in KV
    await oauthService.storeOAuthState(c.env.CACHE, state, c.env.FRONTEND_URL);

    return c.json({ url, state });
  } catch (error) {
    console.error('OAuth login error:', error);
    return c.json({ error: 'Failed to initiate OAuth login' }, 500);
  }
});

// GitHub OAuth callback
auth.get('/github/callback', authRateLimit, async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
      const errorDescription =
        c.req.query('error_description') || 'OAuth authorization failed';
      return c.redirect(
        `${c.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(
          errorDescription
        )}`
      );
    }

    if (!code || !state) {
      return c.redirect(
        `${c.env.FRONTEND_URL}/auth/error?error=Missing+authorization+code+or+state`
      );
    }

    const redirectUri = `${c.req.url.split('/auth')[0]}/auth/github/callback`;

    const oauthService = new GitHubOAuthService(
      c.env.GITHUB_CLIENT_ID,
      c.env.GITHUB_CLIENT_SECRET,
      redirectUri
    );

    // Validate OAuth state
    const oauthState = await oauthService.validateOAuthState(
      c.env.CACHE,
      state
    );
    if (!oauthState) {
      return c.redirect(
        `${c.env.FRONTEND_URL}/auth/error?error=Invalid+or+expired+state`
      );
    }

    // Exchange code for access token
    const accessToken = await oauthService.exchangeCodeForToken(code);

    // Get user info from GitHub
    const githubUser = await oauthService.getUserInfo(accessToken);

    // Create or update user in database
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.JWT_SECRET
    );
    const user = await authService.createOrUpdateUser(githubUser);

    // Create session and tokens
    const { accessToken: jwtToken, refreshToken } =
      await authService.createSession(user);

    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      token: jwtToken,
      refresh_token: refreshToken,
      user: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }),
    });

    return c.redirect(
      `${c.env.FRONTEND_URL}/auth/success?${params.toString()}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect(
      `${c.env.FRONTEND_URL}/auth/error?error=Authentication+failed`
    );
  }
});

// Token refresh endpoint
auth.post('/refresh', authRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { refresh_token } = validateTokenRefresh(body);

    if (!refresh_token) {
      return c.json({ error: 'Refresh token required' }, 400);
    }

    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.JWT_SECRET
    );
    const tokens = await authService.refreshToken(refresh_token);

    if (!tokens) {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    }

    return c.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 500);
  }
});

// Logout endpoint
auth.post('/logout', requireAuth(), async (c) => {
  try {
    const session = c.get('session');

    if (session) {
      const authService = new AuthService(
        c.env.DB,
        c.env.CACHE,
        c.env.JWT_SECRET
      );
      await authService.invalidateSession(session.id);
    }

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// Logout all sessions
auth.post('/logout-all', requireAuth(), async (c) => {
  try {
    const user = c.get('user') as User;

    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.JWT_SECRET
    );
    await authService.invalidateAllUserSessions(user.id);

    return c.json({ message: 'All sessions logged out successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    return c.json({ error: 'Logout all failed' }, 500);
  }
});

// Get current user profile
auth.get('/me', requireAuth(), async (c) => {
  try {
    const user = c.get('user') as User;

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get user profile' }, 500);
  }
});

// Update user profile
auth.put('/me', requireAuth(), async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.json();
    const { name } = validateUserProfile(body);

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Valid name is required' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `
      UPDATE users 
      SET name = ?, updated_at = ?
      WHERE id = ?
    `
    )
      .bind(name.trim(), now, user.id)
      .run();

    return c.json({
      id: user.id,
      email: user.email,
      name: name.trim(),
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: now,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Failed to update user profile' }, 500);
  }
});


// Health check for auth service
auth.get('/health', async (c) => {
  try {
    // Test database connection
    const dbTest = await c.env.DB.prepare('SELECT 1').first();

    // Test KV connection
    await c.env.CACHE.put('health_check', 'ok', { expirationTtl: 60 });

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbTest ? 'connected' : 'disconnected',
      cache: 'connected',
    });
  } catch (error) {
    console.error('Auth health check error:', error);
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default auth;
