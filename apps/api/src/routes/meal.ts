import { Hono } from 'hono';
import { MealTrackerService } from '@second-brain/meal-tracker';
import { requireAuth } from '../middleware/auth';
import {
  createFoodEntrySchema,
  updateFoodEntrySchema,
  foodEntryQuerySchema,
  createUserProfileSchema,
  updateUserProfileSchema,
  createProfileTrackingSchema,
  profileTrackingQuerySchema,
  createFavoriteFoodSchema,
  updateFavoriteFoodSchema,
  favoriteFoodQuerySchema,
  dailyNutritionDateSchema,
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

const mealRoutes = new Hono<{
  Bindings: Env;
  Variables: { user: User; session: AuthSession };
}>();

// Apply auth middleware to all meal routes
mealRoutes.use('*', requireAuth());

// ===== FOOD ENTRY ROUTES =====

// GET /api/v1/meal/food-entries - Get all food entries for the authenticated user
mealRoutes.get('/food-entries', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    // Parse and validate query parameters
    const queryParams = {
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
      mealType: c.req.query('mealType'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    };

    const validatedQuery = foodEntryQuerySchema.parse(queryParams);
    const mealService = new MealTrackerService(c.env.DB);
    const foodEntries = await mealService.getFoodEntries(user.id, validatedQuery);

    return c.json({ foodEntries, count: foodEntries.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to fetch food entries');
  }
});

// POST /api/v1/meal/food-entries - Create a new food entry
mealRoutes.post('/food-entries', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const body = await c.req.json();
    
    // Validate request body
    const validatedData = createFoodEntrySchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const foodEntry = await mealService.createFoodEntry(user.id, validatedData);

    return c.json({ foodEntry }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to create food entry');
  }
});

// GET /api/v1/meal/food-entries/:id - Get a specific food entry
mealRoutes.get('/food-entries/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    
    const mealService = new MealTrackerService(c.env.DB);
    const foodEntry = await mealService.getFoodEntryById(id, user.id);

    if (!foodEntry) {
      return createNotFoundErrorResponse(c, 'Food entry', id);
    }

    return c.json({ foodEntry });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to fetch food entry', 500, { foodEntryId: c.req.param('id') });
  }
});

// PUT /api/v1/meal/food-entries/:id - Update a food entry
mealRoutes.put('/food-entries/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    const body = await c.req.json();
    
    // Validate request body
    const validatedData = updateFoodEntrySchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const updatedFoodEntry = await mealService.updateFoodEntry(id, user.id, validatedData);

    if (!updatedFoodEntry) {
      return createNotFoundErrorResponse(c, 'Food entry', id);
    }

    return c.json({ foodEntry: updatedFoodEntry });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to update food entry', 500, { foodEntryId: c.req.param('id') });
  }
});

// DELETE /api/v1/meal/food-entries/:id - Delete a food entry
mealRoutes.delete('/food-entries/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    
    const mealService = new MealTrackerService(c.env.DB);
    const deleted = await mealService.deleteFoodEntry(id, user.id);

    if (!deleted) {
      return createNotFoundErrorResponse(c, 'Food entry', id);
    }

    return c.json({ message: 'Food entry deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to delete food entry', 500, { foodEntryId: c.req.param('id') });
  }
});

// ===== DAILY NUTRITION SUMMARY ROUTES =====

// GET /api/v1/meal/nutrition/daily/:date - Get daily nutrition summary
mealRoutes.get('/nutrition/daily/:date', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { date } = dailyNutritionDateSchema.parse({ date: c.req.param('date') });
    
    const mealService = new MealTrackerService(c.env.DB);
    const nutritionSummary = await mealService.getDailyNutritionSummary(user.id, date);

    return c.json({ nutritionSummary });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to fetch daily nutrition summary', 500, { date: c.req.param('date') });
  }
});

// ===== USER PROFILE ROUTES =====

// GET /api/v1/meal/profile - Get user profile with calculations
mealRoutes.get('/profile', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const mealService = new MealTrackerService(c.env.DB);
    const profile = await mealService.getUserProfile(user.id);

    if (!profile) {
      return createNotFoundErrorResponse(c, 'User profile');
    }

    return c.json({ profile });
  } catch (error) {
    return createErrorResponse(c, error, 'Failed to fetch user profile');
  }
});

// POST /api/v1/meal/profile - Create user profile
mealRoutes.post('/profile', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const body = await c.req.json();
    
    // Validate request body
    const validatedData = createUserProfileSchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const profile = await mealService.createUserProfile(user.id, validatedData);

    return c.json({ profile }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to create user profile');
  }
});

// PUT /api/v1/meal/profile - Update user profile (auto-calculate BMR/TDEE)
mealRoutes.put('/profile', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const body = await c.req.json();
    
    // Validate request body
    const validatedData = updateUserProfileSchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const updatedProfile = await mealService.updateUserProfile(user.id, validatedData);

    if (!updatedProfile) {
      return createNotFoundErrorResponse(c, 'User profile');
    }

    return c.json({ profile: updatedProfile });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to update user profile');
  }
});

// GET /api/v1/meal/profile/history - Get weight tracking history
mealRoutes.get('/profile/history', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    // Parse and validate query parameters
    const queryParams = {
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    };

    const validatedQuery = profileTrackingQuerySchema.parse(queryParams);
    const mealService = new MealTrackerService(c.env.DB);
    const history = await mealService.getProfileTrackingHistory(user.id, validatedQuery);

    return c.json({ history, count: history.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to fetch profile tracking history');
  }
});

// POST /api/v1/meal/profile/history - Add new weight/body composition record
mealRoutes.post('/profile/history', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const body = await c.req.json();
    
    // Validate request body
    const validatedData = createProfileTrackingSchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const trackingRecord = await mealService.createProfileTracking(user.id, validatedData);

    return c.json({ trackingRecord }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to create profile tracking record');
  }
});

// ===== FAVORITE FOODS ROUTES =====

// GET /api/v1/meal/favorite-foods - Get all favorite foods for the authenticated user
mealRoutes.get('/favorite-foods', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    // Parse and validate query parameters
    const queryParams = {
      category: c.req.query('category'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    };

    const validatedQuery = favoriteFoodQuerySchema.parse(queryParams);
    const mealService = new MealTrackerService(c.env.DB);
    const favoriteFoods = await mealService.getFavoriteFoods(user.id, validatedQuery);

    return c.json({ favoriteFoods, count: favoriteFoods.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to fetch favorite foods');
  }
});

// POST /api/v1/meal/favorite-foods - Create a new favorite food
mealRoutes.post('/favorite-foods', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const body = await c.req.json();
    
    // Validate request body
    const validatedData = createFavoriteFoodSchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const favoriteFood = await mealService.createFavoriteFood(user.id, validatedData);

    return c.json({ favoriteFood }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to create favorite food');
  }
});

// GET /api/v1/meal/favorite-foods/:id - Get a specific favorite food
mealRoutes.get('/favorite-foods/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    
    const mealService = new MealTrackerService(c.env.DB);
    const favoriteFood = await mealService.getFavoriteFoodById(id, user.id);

    if (!favoriteFood) {
      return createNotFoundErrorResponse(c, 'Favorite food', id);
    }

    return c.json({ favoriteFood });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to fetch favorite food', 500, { favoriteFoodId: c.req.param('id') });
  }
});

// PUT /api/v1/meal/favorite-foods/:id - Update a favorite food
mealRoutes.put('/favorite-foods/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    const body = await c.req.json();
    
    // Validate request body
    const validatedData = updateFavoriteFoodSchema.parse(body);
    
    const mealService = new MealTrackerService(c.env.DB);
    const updatedFavoriteFood = await mealService.updateFavoriteFood(id, user.id, validatedData);

    if (!updatedFavoriteFood) {
      return createNotFoundErrorResponse(c, 'Favorite food', id);
    }

    return c.json({ favoriteFood: updatedFavoriteFood });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to update favorite food', 500, { favoriteFoodId: c.req.param('id') });
  }
});

// DELETE /api/v1/meal/favorite-foods/:id - Delete a favorite food
mealRoutes.delete('/favorite-foods/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    
    const mealService = new MealTrackerService(c.env.DB);
    const deleted = await mealService.deleteFavoriteFood(id, user.id);

    if (!deleted) {
      return createNotFoundErrorResponse(c, 'Favorite food', id);
    }

    return c.json({ message: 'Favorite food deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    return createErrorResponse(c, error, 'Failed to delete favorite food', 500, { favoriteFoodId: c.req.param('id') });
  }
});

// POST /api/v1/meal/favorite-foods/:id/add-to-log - Quick add favorite food to daily log
mealRoutes.post('/favorite-foods/:id/add-to-log', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return createAuthErrorResponse(c, new Error('User context not found'), 'Authentication middleware did not set user context');
    }

    const { id } = idParamSchema.parse({ id: c.req.param('id') });
    const body = await c.req.json();
    
    // Validate meal type from request body
    const mealType = body.mealType;
    if (!mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return createValidationErrorResponse(c, new Error('Valid mealType is required (breakfast, lunch, dinner, snack)'));
    }
    
    const mealService = new MealTrackerService(c.env.DB);
    const foodEntry = await mealService.addFavoriteFoodToLog(id, user.id, mealType);

    return c.json({ foodEntry, message: 'Favorite food added to log successfully' }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('parse')) {
      return createValidationErrorResponse(c, error);
    }
    
    return createErrorResponse(c, error, 'Failed to add favorite food to log', 500, { favoriteFoodId: c.req.param('id') });
  }
});

export default mealRoutes;