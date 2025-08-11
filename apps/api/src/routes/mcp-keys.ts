import { Hono } from 'hono';
import { MealTrackerService } from '@second-brain/meal-tracker';
import { requireAuth } from '../middleware/auth';
import {
  createMCPApiKeySchema,
  updateMCPApiKeySchema,
  idParamSchema,
} from '@second-brain/meal-tracker/validation';
import { User, AuthSession } from '../types/auth';
import {
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createAuthErrorResponse
} from '../utils/errorHandler';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const mcpKeyRoutes = new Hono<{
  Bindings: Env;
  Variables: { user: User; session: AuthSession };
}>();

// Apply auth middleware to all meal routes
mcpKeyRoutes.use('*', requireAuth());

// GET /api/v1/meal/mcp-keys - Get all MCP API keys for the authenticated user
mcpKeyRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'));
    }

    const mealService = new MealTrackerService(c.env.DB);
    const apiKeys = await mealService.getMCPApiKeys(user.id);

    return c.json({ apiKeys });
  } catch (error) {
    return createErrorResponse(c, error, 'Failed to fetch MCP API keys');
  }
});

// POST /api/v1/meal/mcp-keys - Create a new MCP API key
mcpKeyRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'));
    }

    const body = await c.req.json().catch(() => ({})); // Allow empty body
    const validatedData = createMCPApiKeySchema.parse(body);

    const mealService = new MealTrackerService(c.env.DB);
    const newKey = await mealService.createMCPApiKey(user.id, validatedData);

    // The full key is only returned on creation
    return c.json({ apiKey: newKey }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to create MCP API key');
  }
});

// PUT /api/v1/meal/mcp-keys/:id - Update an MCP API key's name
mcpKeyRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'));
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    const body = await c.req.json();
    const validatedData = updateMCPApiKeySchema.parse(body);

    const mealService = new MealTrackerService(c.env.DB);
    const updatedKey = await mealService.updateMCPApiKeyName(id, user.id, validatedData);

    if (!updatedKey) {
      return createNotFoundErrorResponse(c, 'MCP API key', id);
    }

    return c.json({ apiKey: updatedKey });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to update MCP API key');
  }
});

// DELETE /api/v1/meal/mcp-keys/:id - Revoke an MCP API key
mcpKeyRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'));
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });

    const mealService = new MealTrackerService(c.env.DB);
    const revoked = await mealService.revokeMCPApiKey(id, user.id);

    if (!revoked) {
      return createNotFoundErrorResponse(c, 'MCP API key', id);
    }

    return c.json({ message: 'MCP API key revoked successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to revoke MCP API key');
  }
});

export default mcpKeyRoutes;
