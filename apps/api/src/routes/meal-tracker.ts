// Comprehensive meal-tracker API routes for health and nutrition tracking

import type { AuthSession, User } from "@second-brain/types/auth";
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { MealTrackerService } from "../services/meal-tracker";
import { OpenRouterService } from "../services/openrouter";
import {
	createAuthErrorResponse,
	createErrorResponse,
	createNotFoundErrorResponse,
	createValidationErrorResponse,
} from "../utils/errorHandler";
import {
	validateCreateProfile,
	validateUpdateProfile,
	validateProfileResponse,
	validateCreateMeal,
	validateUpdateMeal,
	validateMealsQuery,
	validateDailySummaryQuery,
	validateStreakResponse,
	validateStreakCalendarQuery,
	validateFreeze,
	validateCreateFavorite,
	validateUpdateFavorite,
	validateFavoritesResponse,
	validateQuickAddFavorite,
	validateQuickAddFavoriteResponse,
	validateAnalyticsQuery,
	validateDailyAnalytics,
	validateWeeklyAnalytics,
	validateMonthlyAnalytics,
	validateTrendsQuery,
	validateFoodSearchQuery,
	validateFoodSearchResponse,
	validateEstimateMacros,
	validateMacroEstimationResponse,
	validateBulkDeleteMeals,
	validateBulkDeleteFavorites,
	type CreateProfileRequest,
	type UpdateProfileRequest,
	type ProfileResponse,
	type CreateMealRequest,
	type UpdateMealRequest,
	type MealsQuery,
	type DailySummaryQuery,
	type StreakResponse,
	type StreakCalendarQuery,
	type FreezeRequest,
	type CreateFavoriteRequest,
	type UpdateFavoriteRequest,
	type FavoritesResponse,
	type QuickAddFavoriteRequest,
	type QuickAddFavoriteResponse,
	type AnalyticsQuery,
	type DailyAnalyticsQuery,
	type WeeklyAnalyticsQuery,
	type MonthlyAnalyticsQuery,
	type TrendsQuery,
	type FoodSearchQuery,
	type FoodSearchResponse,
	type EstimateMacrosRequest,
	type MacroEstimationResponse,
	type BulkDeleteMealsRequest,
	type BulkDeleteFavoritesRequest,
} from "../validation/meal-tracker";

interface Env {
	DB: D1Database;
	CACHE: KVNamespace;
	JWT_SECRET: string;
	FRONTEND_URL: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	OPENROUTER_API_KEY: string;
}

const mealTrackerRoutes = new Hono<{
	Bindings: Env;
	Variables: { user: User; session: AuthSession };
}>();

// Apply auth middleware to all meal-tracker routes
mealTrackerRoutes.use("*", requireAuth());

// User Profile & TDEE Endpoints

// GET /api/v1/meal-tracker/profile - Get user profile
mealTrackerRoutes.get("/profile", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const mealService = new MealTrackerService(c.env.DB);
		const profile = await mealService.getUserProfile(user.id);

		if (!profile) {
			return createNotFoundErrorResponse(c, "User profile");
		}

		const validatedProfile = validateProfileResponse(profile);
		return c.json({ profile: validatedProfile });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch user profile");
	}
});

// POST /api/v1/meal-tracker/profile - Create profile
mealTrackerRoutes.post("/profile", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const profileData = validateCreateProfile(body);

		const mealService = new MealTrackerService(c.env.DB);
		const profile = await mealService.createOrUpdateUserProfile(user.id, profileData);

		const validatedProfile = validateProfileResponse(profile);
		return c.json({ profile: validatedProfile }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to create user profile");
	}
});

// PUT /api/v1/meal-tracker/profile - Update profile
mealTrackerRoutes.put("/profile", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const profileData = validateUpdateProfile(body);

		const mealService = new MealTrackerService(c.env.DB);
		const profile = await mealService.createOrUpdateUserProfile(user.id, profileData);

		const validatedProfile = validateProfileResponse(profile);
		return c.json({ profile: validatedProfile });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to update user profile");
	}
});

// Meal Management Endpoints

// GET /api/v1/meal-tracker/meals - Get meals for date range
mealTrackerRoutes.get("/meals", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const dateParam = c.req.query("date");
		const query = {
			startDate: c.req.query("startDate") || dateParam,
			endDate: c.req.query("endDate"),
		};

		const validatedQuery = validateMealsQuery(query);

		const mealService = new MealTrackerService(c.env.DB);
		const result = await mealService.getMealsByUser(user.id, {
			date: validatedQuery.startDate || dateParam,
			limit: validatedQuery.limit,
		});

		return c.json({ meals: result.meals, total: result.total });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch meals");
	}
});

// GET /api/v1/meal-tracker/meals/daily - Get daily summary
mealTrackerRoutes.get("/meals/daily", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			date: c.req.query("date"),
		};

		const validatedQuery = validateDailySummaryQuery(query);

		const mealService = new MealTrackerService(c.env.DB);
		const summary = await mealService.getDailySummary(user.id, validatedQuery.date || new Date().toISOString().split('T')[0]);

		if (!summary) {
			return c.json({
				dailySummary: {
					date: validatedQuery.date,
					totalCalories: 0,
					totalProteinG: 0,
					totalCarbsG: 0,
					totalFatG: 0,
					mealCount: 0,
					targetCalories: 0
				}
			});
		}

		return c.json({ dailySummary: summary });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch daily summary");
	}
});

// POST /api/v1/meal-tracker/meals - Create meal (manual)
mealTrackerRoutes.post("/meals", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const mealData = validateCreateMeal(body);

		const mealService = new MealTrackerService(c.env.DB);
		const meal = await mealService.createMeal(user.id, mealData);

		return c.json({ meal }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to create meal");
	}
});

// PUT /api/v1/meal-tracker/meals/:id - Update meal
mealTrackerRoutes.put("/meals/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");
		const body = await c.req.json();
		const mealData = validateUpdateMeal(body);

		const mealService = new MealTrackerService(c.env.DB);
		const meal = await mealService.updateMeal(id, user.id, mealData);

		if (!meal) {
			return createNotFoundErrorResponse(c, "Meal", id);
		}

		return c.json({ meal });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to update meal", 500, {
			mealId: c.req.param("id"),
		});
	}
});

// DELETE /api/v1/meal-tracker/meals/:id - Delete meal
mealTrackerRoutes.delete("/meals/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");

		const mealService = new MealTrackerService(c.env.DB);
		const deleted = await mealService.deleteMeal(id, user.id);

		if (!deleted) {
			return createNotFoundErrorResponse(c, "Meal", id);
		}

		return c.json({ message: "Meal deleted successfully" });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to delete meal", 500, {
			mealId: c.req.param("id"),
		});
	}
});

// POST /api/v1/meal-tracker/meals/bulk-delete - Delete multiple meals
mealTrackerRoutes.post("/meals/bulk-delete", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const deleteData = validateBulkDeleteMeals(body);

		// Note: Service layer would need a bulkDeleteMeals method
		// For now, we'll implement individual deletion
		const mealService = new MealTrackerService(c.env.DB);
		let deletedCount = 0;
		const errors: string[] = [];

		for (const mealId of deleteData.ids) {
			try {
				const deleted = await mealService.deleteMeal(mealId, user.id);
				if (deleted) deletedCount++;
			} catch (error) {
				errors.push(`Failed to delete meal ${mealId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		return c.json({
			message: `Successfully deleted ${deletedCount} meal(s)`,
			deletedCount,
			requestedCount: deleteData.ids.length,
			errors: errors.length > 0 ? errors : undefined
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to bulk delete meals");
	}
});

// POST /api/v1/meal-tracker/meals/from-image - Create meal from AI (future placeholder)
mealTrackerRoutes.post("/meals/from-image", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		// This is a placeholder for future AI integration
		return c.json({
			message: "AI meal analysis is not yet implemented. Please use manual meal creation.",
			feature: "ai_meal_analysis",
			status: "planned"
		}, 501); // 501 Not Implemented
	} catch (error) {
		return createErrorResponse(c, error, "Failed to process AI meal analysis");
	}
});

// Streak Management Endpoints

// GET /api/v1/meal-tracker/streak - Get current streak
mealTrackerRoutes.get("/streak", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const mealService = new MealTrackerService(c.env.DB);
		let streak = await mealService.getStreak(user.id);

		if (!streak) {
			streak = await mealService.initializeStreak(user.id);
		}

		const validatedStreak = validateStreakResponse(streak);
		return c.json({ streak: validatedStreak });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch streak");
	}
});

// GET /api/v1/meal-tracker/streak/calendar - Get streak calendar
mealTrackerRoutes.get("/streak/calendar", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			year: parseInt(c.req.query("year") || new Date().getFullYear().toString()),
			month: parseInt(c.req.query("month") || (new Date().getMonth() + 1).toString()),
		};

		const validatedQuery = validateStreakCalendarQuery(query);

		const mealService = new MealTrackerService(c.env.DB);
		const calendarData = await mealService.getStreakCalendar(user.id, validatedQuery.year!, validatedQuery.month!);

		return c.json(calendarData);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch streak calendar");
	}
});

// POST /api/v1/meal-tracker/streak/freeze - Use freeze credit
mealTrackerRoutes.post("/streak/freeze", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const freezeData = validateFreeze(body);

		const mealService = new MealTrackerService(c.env.DB);
		const success = await mealService.useFreezeCredit(user.id);

		if (!success) {
			return c.json({
				error: "No freeze credits available or streak not found",
				freeze_credits_available: false
			}, 400);
		}

		return c.json({
			message: "Freeze credit used successfully",
			freeze_used: true
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to use freeze credit");
	}
});

// Favorite Foods Endpoints

// GET /api/v1/meal-tracker/favorites - Get favorites
mealTrackerRoutes.get("/favorites", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const mealService = new MealTrackerService(c.env.DB);
		const favorites = await mealService.getFavoriteFoodsByUser(user.id);

		const validatedFavorites = validateFavoritesResponse(favorites);
		return c.json({ favorites: validatedFavorites });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch favorite foods");
	}
});

// POST /api/v1/meal-tracker/favorites - Create favorite
mealTrackerRoutes.post("/favorites", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const favoriteData = validateCreateFavorite(body);

		const mealService = new MealTrackerService(c.env.DB);
		const favorite = await mealService.createFavoriteFood(user.id, favoriteData);

		return c.json({ favorite }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to create favorite food");
	}
});

// PUT /api/v1/meal-tracker/favorites/:id - Update favorite
mealTrackerRoutes.put("/favorites/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");
		const body = await c.req.json();
		const favoriteData = validateUpdateFavorite(body);

		const mealService = new MealTrackerService(c.env.DB);
		const favorite = await mealService.updateFavoriteFood(id, user.id, favoriteData);

		if (!favorite) {
			return createNotFoundErrorResponse(c, "Favorite food", id);
		}

		return c.json({ favorite });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to update favorite food", 500, {
			favoriteId: c.req.param("id"),
		});
	}
});

// DELETE /api/v1/meal-tracker/favorites/:id - Delete favorite
mealTrackerRoutes.delete("/favorites/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");

		const mealService = new MealTrackerService(c.env.DB);
		const deleted = await mealService.deleteFavoriteFood(id, user.id);

		if (!deleted) {
			return createNotFoundErrorResponse(c, "Favorite food", id);
		}

		return c.json({ message: "Favorite food deleted successfully" });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to delete favorite food", 500, {
			favoriteId: c.req.param("id"),
		});
	}
});

// POST /api/v1/meal-tracker/favorites/:id/log - Quick-add favorite
mealTrackerRoutes.post("/favorites/:id/log", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");
		const body = await c.req.json();
		const logData = validateQuickAddFavorite(body);

		const mealService = new MealTrackerService(c.env.DB);

		// Get the favorite food
		const favorite = await mealService.getFavoriteFoodById(id, user.id);
		if (!favorite) {
			return createNotFoundErrorResponse(c, "Favorite food", id);
		}

		// Increment usage count
		await mealService.incrementFavoriteFoodUsage(id, user.id);

		// Create a meal from the favorite
		const mealData = {
			mealType: logData.mealType,
			foodName: favorite.foodName,
			calories: favorite.calories,
			proteinG: favorite.proteinG ?? undefined,
			carbsG: favorite.carbsG ?? undefined,
			fatG: favorite.fatG ?? undefined,
			servingSize: favorite.servingSize ?? undefined,
			servingUnit: favorite.servingUnit ?? undefined,
			loggedAt: logData.loggedAt,
		};

		const meal = await mealService.createMeal(user.id, mealData);

		const response = {
			meal,
			favorite: {
				id: favorite.id,
				usageCount: (favorite.usageCount ?? 0) + 1
			}
		};

		const validatedResponse = validateQuickAddFavoriteResponse(response);
		return c.json({ data: validatedResponse }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to quick-add favorite", 500, {
			favoriteId: c.req.param("id"),
		});
	}
});

// POST /api/v1/meal-tracker/favorites/bulk-delete - Delete multiple favorites
mealTrackerRoutes.post("/favorites/bulk-delete", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const deleteData = validateBulkDeleteFavorites(body);

		const mealService = new MealTrackerService(c.env.DB);
		let deletedCount = 0;
		const errors: string[] = [];

		for (const favoriteId of deleteData.ids) {
			try {
				const deleted = await mealService.deleteFavoriteFood(favoriteId, user.id);
				if (deleted) deletedCount++;
			} catch (error) {
				errors.push(`Failed to delete favorite ${favoriteId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		return c.json({
			message: `Successfully deleted ${deletedCount} favorite(s)`,
			deletedCount,
			requestedCount: deleteData.ids.length,
			errors: errors.length > 0 ? errors : undefined
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to bulk delete favorites");
	}
});

// Analytics Endpoints

// GET /api/v1/meal-tracker/analytics/daily - Daily analytics
mealTrackerRoutes.get("/analytics/daily", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			date: c.req.query("date") || new Date().toISOString().split('T')[0],
		};

		const validatedQuery = validateDailyAnalytics(query);

		const mealService = new MealTrackerService(c.env.DB);
		const date = validatedQuery.date;
		const startOfWeek = new Date(date);
		startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(endOfWeek.getDate() + 6);

		const analytics = await mealService.getNutritionAnalytics(
			user.id,
			startOfWeek.toISOString().split('T')[0],
			endOfWeek.toISOString().split('T')[0]
		);

		return c.json({ analytics });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch daily analytics");
	}
});

// GET /api/v1/meal-tracker/analytics/weekly - Weekly analytics
mealTrackerRoutes.get("/analytics/weekly", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			startDate: c.req.query("startDate"),
		};

		const validatedQuery = validateWeeklyAnalytics(query);

		const mealService = new MealTrackerService(c.env.DB);
		const weeks = 4; // Default 4 weeks
		const analytics = await mealService.getWeeklySummaries(user.id, weeks);

		return c.json({ analytics });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch weekly analytics");
	}
});

// GET /api/v1/meal-tracker/analytics/monthly - Monthly analytics
mealTrackerRoutes.get("/analytics/monthly", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			year: parseInt(c.req.query("year") || new Date().getFullYear().toString()),
			month: parseInt(c.req.query("month") || (new Date().getMonth() + 1).toString()),
		};

		const validatedQuery = validateMonthlyAnalytics(query);

		const mealService = new MealTrackerService(c.env.DB);
		const startDate = new Date(validatedQuery.year!, validatedQuery.month! - 1, 1);
		const endDate = new Date(validatedQuery.year!, validatedQuery.month!, 0);

		const analytics = await mealService.getNutritionAnalytics(
			user.id,
			startDate.toISOString().split('T')[0],
			endDate.toISOString().split('T')[0]
		);

		return c.json({ analytics });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch monthly analytics");
	}
});

// GET /api/v1/meal-tracker/analytics/trends - Trends analysis
mealTrackerRoutes.get("/analytics/trends", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			period: c.req.query("period") || "30d",
			includeWeight: c.req.query("includeWeight") === "true",
		};

		const validatedQuery = validateTrendsQuery(query);

		const mealService = new MealTrackerService(c.env.DB);

		let days: number;
		switch (validatedQuery.period) {
			case "7d":
				days = 7;
				break;
			case "30d":
				days = 30;
				break;
			case "90d":
				days = 90;
				break;
			default:
				days = 30;
		}

		const endDate = new Date().toISOString().split('T')[0];
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		startDate.setHours(0, 0, 0, 0);
		const startDateStr = startDate.toISOString().split('T')[0];

		const nutritionAnalytics = await mealService.getNutritionAnalytics(user.id, startDateStr, endDate);
		const macroDistribution = await mealService.getMacroDistribution(user.id, days);
		const weeklySummaries = await mealService.getWeeklySummaries(user.id, Math.ceil(days / 7));

		return c.json({
			trends: {
				nutrition: nutritionAnalytics,
				macroDistribution,
				weeklyTrends: weeklySummaries,
				period: validatedQuery.period
			}
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to fetch trends analysis");
	}
});

// Food Search Endpoints

// GET /api/v1/meal-tracker/foods/search - Search foods
mealTrackerRoutes.get("/foods/search", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const query = {
			q: c.req.query("q"),
			limit: parseInt(c.req.query("limit") || "20"),
		};

		const validatedQuery = validateFoodSearchQuery(query);

		const mealService = new MealTrackerService(c.env.DB);
		const foods = await mealService.searchFoods(validatedQuery.q, validatedQuery.limit);

		const validatedFoods = validateFoodSearchResponse(foods);
		return c.json({ foods: validatedFoods });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to search foods");
	}
});

// POST /api/v1/meal-tracker/foods/estimate-macros - Estimate macros using AI
mealTrackerRoutes.post("/foods/estimate-macros", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();
		const requestData = validateEstimateMacros(body);

		const apiKey = c.env.OPENROUTER_API_KEY;
		if (!apiKey) {
			return c.json({
				error: "OpenRouter API key not configured",
				message: "AI macro estimation is not available. Please configure OPENROUTER_API_KEY.",
			}, 503);
		}

		const openRouterService = new OpenRouterService(apiKey);
		const estimation = await openRouterService.estimateMacros(requestData);

		const validatedEstimation = validateMacroEstimationResponse(estimation);
		return c.json({ estimation: validatedEstimation });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to estimate macros");
	}
});

// POST /api/v1/meal-tracker/foods/analyze-image - Analyze food image with Gemini Vision via OpenRouter
mealTrackerRoutes.post("/foods/analyze-image", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const formData = await c.req.formData();
		const imageFile = formData.get('image');

		if (!imageFile || typeof imageFile === 'string') {
			return c.json({
				error: "No image file provided",
				message: "Please upload an image file"
			}, 400);
		}

		const apiKey = c.env.OPENROUTER_API_KEY;
		if (!apiKey) {
			return c.json({
				error: "OpenRouter API key not configured",
				message: "Image analysis is not available. Please configure OPENROUTER_API_KEY."
			}, 503);
		}

		const imageBuffer = await (imageFile as File).arrayBuffer();
		const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
		const dataUrl = `data:image/jpeg;base64,${base64Image}`;

		const prompt = `Analyze this food image and provide detailed nutritional information.

IMPORTANT Instructions:
- If this is Thai food, use the Thai name in Thai language (e.g., "ผัดกะเพราหมู", "ส้มตำ", "ข้าวผัด")
- If it's international food, use the common English name
- Estimate the portion size visible in the image
- Provide realistic nutritional values based on the estimated portion

Return ONLY a valid JSON object (no markdown, no explanations) with this EXACT structure:
{
  "foodName": "name of the food in Thai language if Thai food, English if international",
  "calories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "servingSize": "estimated portion size as string (e.g., \"200\", \"1\", \"350\")",
  "servingUnit": "unit as string (e.g., \"g\", \"ml\", \"plate\", \"bowl\", \"piece\", \"cup\")",
  "confidence": "high" | "medium" | "low",
  "description": "brief description of the food and what you detected"
}`;

		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": c.env.FRONTEND_URL,
				"X-Title": "Second Brain - Meal Tracker"
			},
			body: JSON.stringify({
				model: "google/gemini-2.5-flash",
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: prompt
							},
							{
								type: "image_url",
								image_url: {
									url: dataUrl
								}
							}
						]
					}
				],
				temperature: 0.4,
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`OpenRouter API failed: ${response.status} - ${errorText}`);
		}

		const data = await response.json() as any;
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			throw new Error("No response from vision model");
		}

		let cleanContent = content.trim();
		if (cleanContent.startsWith("```json")) {
			cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
		} else if (cleanContent.startsWith("```")) {
			cleanContent = cleanContent.replace(/```\n?/g, '').trim();
		}

		const nutritionInfo = JSON.parse(cleanContent);

		return c.json({
			foodName: nutritionInfo.foodName || "Unknown Food",
			calories: nutritionInfo.calories || 0,
			proteinG: nutritionInfo.proteinG || 0,
			carbsG: nutritionInfo.carbsG || 0,
			fatG: nutritionInfo.fatG || 0,
			servingSize: nutritionInfo.servingSize ? String(nutritionInfo.servingSize) : undefined,
			servingUnit: nutritionInfo.servingUnit ? String(nutritionInfo.servingUnit) : undefined,
			confidence: nutritionInfo.confidence || "low",
			description: nutritionInfo.description || "Food detected from image",
		});
	} catch (error) {
		console.error("Food image analysis error:", error);
		return createErrorResponse(c, error, "Failed to analyze food image");
	}
});

export default mealTrackerRoutes;