// Input validation schemas for meal-tracker feature

import { z } from "zod";

// Enums based on PRD
export const genderSchema = z.enum(["male", "female", "other"]);
export const activityLevelSchema = z.enum([
	"sedentary",
	"lightly_active",
	"moderately_active",
	"very_active",
	"extremely_active",
]);
export const goalSchema = z.enum(["lose_weight", "maintain_weight", "gain_weight"]);
export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

// User Profile & TDEE
export const createProfileSchema = z.object({
	age: z
		.number()
		.min(1, "Age must be at least 1")
		.max(120, "Age must be at most 120")
		.int("Age must be an integer"),
	weightKg: z
		.number()
		.min(1, "Weight must be at least 1 kg")
		.max(300, "Weight must be at most 300 kg")
		.positive("Weight must be positive"),
	heightCm: z
		.number()
		.min(50, "Height must be at least 50 cm")
		.max(250, "Height must be at most 250 cm")
		.positive("Height must be positive"),
	gender: genderSchema,
	activityLevel: activityLevelSchema,
	goal: goalSchema,
});

export const updateProfileSchema = createProfileSchema.partial();

export const profileResponseSchema = createProfileSchema.extend({
	tdee: z
		.number()
		.min(500, "TDEE must be at least 500 calories")
		.max(5000, "TDEE must be at most 5000 calories"),
	targetCalories: z
		.number()
		.min(500, "Target calories must be at least 500")
		.max(5000, "Target calories must be at most 5000"),
	targetProteinG: z
		.number()
		.min(10, "Target protein must be at least 10g")
		.max(500, "Target protein must be at most 500g"),
	targetCarbsG: z
		.number()
		.min(10, "Target carbs must be at least 10g")
		.max(1000, "Target carbs must be at most 1000g"),
	targetFatG: z
		.number()
		.min(5, "Target fat must be at least 5g")
		.max(300, "Target fat must be at most 300g"),
});

// Meal Management
export const createMealSchema = z.object({
	mealType: mealTypeSchema,
	foodName: z
		.string()
		.min(1, "Food name is required")
		.max(200, "Food name must be less than 200 characters")
		.trim(),
	calories: z
		.number()
		.min(1, "Calories must be at least 1")
		.max(5000, "Calories must be at most 5000")
		.positive("Calories must be positive"),
	proteinG: z
		.number()
		.min(0, "Protein cannot be negative")
		.max(1000, "Protein must be at most 1000g")
		.optional(),
	carbsG: z
		.number()
		.min(0, "Carbs cannot be negative")
		.max(1000, "Carbs must be at most 1000g")
		.optional(),
	fatG: z
		.number()
		.min(0, "Fat cannot be negative")
		.max(300, "Fat must be at most 300g")
		.optional(),
	servingSize: z
		.string()
		.max(50, "Serving size must be less than 50 characters")
		.optional(),
	servingUnit: z
		.string()
		.max(20, "Serving unit must be less than 20 characters")
		.optional(),
	notes: z
		.string()
		.max(500, "Notes must be less than 500 characters")
		.optional(),
	imageUrl: z
		.string()
		.url("Invalid image URL format")
		.max(500, "Image URL must be less than 500 characters")
		.optional()
		.nullable(),
	loggedAt: z
		.string()
		.datetime("Invalid datetime format")
		.optional(),
});

export const updateMealSchema = createMealSchema.partial();

export const mealsQuerySchema = z.object({
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
		.optional(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
		.optional(),
	limit: z
		.number()
		.min(1, "Limit must be at least 1")
		.max(100, "Limit must be at most 100")
		.optional()
		.default(50),
});

export const dailySummaryQuerySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
		.optional(),
});

// Streak Management
export const streakResponseSchema = z.object({
	currentStreak: z.number().min(0, "Current streak cannot be negative"),
	longestStreak: z.number().min(0, "Longest streak cannot be negative"),
	lastLoggedDate: z.string().datetime("Invalid datetime format").nullable(),
	freezeCredits: z
		.number()
		.min(0, "Freeze credits cannot be negative")
		.max(12, "Freeze credits cannot exceed 12"),
	totalLoggedDays: z.number().min(0, "Total logged days cannot be negative"),
});

export const streakCalendarQuerySchema = z.object({
	year: z
		.number()
		.min(2000, "Year must be at least 2000")
		.max(2100, "Year must be at most 2100")
		.optional(),
	month: z
		.number()
		.min(1, "Month must be at least 1")
		.max(12, "Month must be at most 12")
		.optional(),
});

export const freezeSchema = z.object({
	reason: z
		.string()
		.max(200, "Reason must be less than 200 characters")
		.optional(),
});

// Favorite Foods
export const createFavoriteSchema = z.object({
	foodName: z
		.string()
		.min(1, "Food name is required")
		.max(200, "Food name must be less than 200 characters")
		.trim(),
	calories: z
		.number()
		.min(1, "Calories must be at least 1")
		.max(5000, "Calories must be at most 5000")
		.positive("Calories must be positive"),
	proteinG: z
		.number()
		.min(0, "Protein cannot be negative")
		.max(1000, "Protein must be at most 1000g")
		.optional(),
	carbsG: z
		.number()
		.min(0, "Carbs cannot be negative")
		.max(1000, "Carbs must be at most 1000g")
		.optional(),
	fatG: z
		.number()
		.min(0, "Fat cannot be negative")
		.max(300, "Fat must be at most 300g")
		.optional(),
	servingSize: z
		.string()
		.max(50, "Serving size must be less than 50 characters")
		.optional(),
	servingUnit: z
		.string()
		.max(20, "Serving unit must be less than 20 characters")
		.optional(),
	category: z
		.string()
		.max(50, "Category must be less than 50 characters")
		.optional(),
});

export const updateFavoriteSchema = createFavoriteSchema.partial();

export const favoritesResponseSchema = z.array(z.object({
	id: z.string().uuid("Invalid favorite ID"),
	foodName: z.string().min(1).max(200),
	calories: z.number().min(1).max(5000),
	proteinG: z.number().min(0).max(1000),
	carbsG: z.number().min(0).max(1000),
	fatG: z.number().min(0).max(300),
	servingSize: z.string().max(50).nullable(),
	servingUnit: z.string().max(20).nullable(),
	category: z.string().max(50).nullable(),
	usageCount: z.number().min(0),
	lastUsedAt: z.string().datetime().nullable(),
}));

export const quickAddFavoriteSchema = z.object({
	mealType: mealTypeSchema,
	loggedAt: z.string().datetime().optional(),
});

export const quickAddFavoriteResponseSchema = z.object({
	meal: z.object({
		id: z.string().uuid(),
		userId: z.string(),
		mealType: mealTypeSchema,
		foodName: z.string(),
		calories: z.number(),
		proteinG: z.number(),
		carbsG: z.number(),
		fatG: z.number(),
		servingSize: z.string().nullable(),
		servingUnit: z.string().nullable(),
		imageUrl: z.string().nullable(),
		notes: z.string().nullable(),
		loggedAt: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	}),
	favorite: z.object({
		id: z.string().uuid(),
		usageCount: z.number(),
	}),
});

// Analytics
export const analyticsQuerySchema = z.object({
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
		.optional(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
		.optional(),
	limit: z
		.number()
		.min(1, "Limit must be at least 1")
		.max(100, "Limit must be at most 100")
		.optional()
		.default(30),
});

export const dailyAnalyticsSchema = analyticsQuerySchema.extend({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const weeklyAnalyticsSchema = analyticsQuerySchema.extend({
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
});

export const monthlyAnalyticsSchema = analyticsQuerySchema.extend({
	year: z.number().min(2000).max(2100),
	month: z.number().min(1).max(12),
});

export const trendsQuerySchema = z.object({
	period: z.enum(["7d", "14d", "30d", "90d"]).default("30d"),
	includeWeight: z.boolean().default(false),
});

// Food Search
export const foodSearchQuerySchema = z.object({
	q: z
		.string()
		.min(1, "Search query is required")
		.max(100, "Search query must be less than 100 characters")
		.trim(),
	limit: z
		.number()
		.min(1, "Limit must be at least 1")
		.max(50, "Limit must be at most 50")
		.optional()
		.default(20),
});

export const foodSearchResponseSchema = z.array(z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(200),
	brand: z.string().max(100).nullable(),
	caloriesPer100g: z.number().min(0).max(5000),
	proteinPer100g: z.number().min(0).max(1000),
	carbsPer100g: z.number().min(0).max(1000),
	fatPer100g: z.number().min(0).max(300),
	servingSizeG: z.number().positive().nullable(),
	servingDescription: z.string().max(100).nullable(),
	category: z.string().max(50).nullable(),
}));

// AI Image Analysis
export const aiImageAnalysisSchema = z.object({
	suggestions: z.array(z.object({
		foodName: z
			.string()
			.min(1, "Food name is required")
			.max(200, "Food name must be less than 200 characters")
			.trim(),
		calories: z.number().min(1).max(5000),
		proteinG: z.number().min(0).max(1000),
		carbsG: z.number().min(0).max(1000),
		fatG: z.number().min(0).max(300),
		confidence: z.number().min(0).max(1),
	})).min(1, "At least one suggestion is required"),
	mealId: z.string().uuid("Invalid meal ID"),
});

// AI Macro Estimation
export const estimateMacrosSchema = z.object({
	foodName: z
		.string()
		.min(1, "Food name is required")
		.max(200, "Food name must be less than 200 characters")
		.trim(),
	servingSize: z
		.string()
		.max(50, "Serving size must be less than 50 characters")
		.optional(),
	servingUnit: z
		.string()
		.max(20, "Serving unit must be less than 20 characters")
		.optional(),
	notes: z
		.string()
		.max(500, "Notes must be less than 500 characters")
		.optional(),
});

export const macroEstimationResponseSchema = z.object({
	calories: z.number().min(0).max(5000),
	proteinG: z.number().min(0).max(1000),
	carbsG: z.number().min(0).max(1000),
	fatG: z.number().min(0).max(300),
	confidence: z.enum(["high", "medium", "low"]),
	reasoning: z.string().optional(),
});

// Bulk Operations
export const bulkDeleteMealsSchema = z.object({
	ids: z
		.array(z.string().uuid())
		.min(1, "At least one meal ID is required")
		.max(100, "Cannot delete more than 100 meals at once"),
});

export const bulkDeleteFavoritesSchema = z.object({
	ids: z
		.array(z.string().uuid())
		.min(1, "At least one favorite ID is required")
		.max(100, "Cannot delete more than 100 favorites at once"),
});

// Validation helper functions
export function validateCreateProfile(data: unknown) {
	return createProfileSchema.parse(data);
}

export function validateUpdateProfile(data: unknown) {
	return updateProfileSchema.parse(data);
}

export function validateProfileResponse(data: unknown) {
	return profileResponseSchema.parse(data);
}

export function validateCreateMeal(data: unknown) {
	return createMealSchema.parse(data);
}

export function validateUpdateMeal(data: unknown) {
	return updateMealSchema.parse(data);
}

export function validateMealsQuery(data: unknown) {
	return mealsQuerySchema.parse(data);
}

export function validateDailySummaryQuery(data: unknown) {
	return dailySummaryQuerySchema.parse(data);
}

export function validateStreakResponse(data: unknown) {
	return streakResponseSchema.parse(data);
}

export function validateStreakCalendarQuery(data: unknown) {
	return streakCalendarQuerySchema.parse(data);
}

export function validateFreeze(data: unknown) {
	return freezeSchema.parse(data);
}

export function validateCreateFavorite(data: unknown) {
	return createFavoriteSchema.parse(data);
}

export function validateUpdateFavorite(data: unknown) {
	return updateFavoriteSchema.parse(data);
}

export function validateFavoritesResponse(data: unknown) {
	return favoritesResponseSchema.parse(data);
}

export function validateQuickAddFavorite(data: unknown) {
	return quickAddFavoriteSchema.parse(data);
}

export function validateQuickAddFavoriteResponse(data: unknown) {
	return quickAddFavoriteResponseSchema.parse(data);
}

export function validateAnalyticsQuery(data: unknown) {
	return analyticsQuerySchema.parse(data);
}

export function validateDailyAnalytics(data: unknown) {
	return dailyAnalyticsSchema.parse(data);
}

export function validateWeeklyAnalytics(data: unknown) {
	return weeklyAnalyticsSchema.parse(data);
}

export function validateMonthlyAnalytics(data: unknown) {
	return monthlyAnalyticsSchema.parse(data);
}

export function validateTrendsQuery(data: unknown) {
	return trendsQuerySchema.parse(data);
}

export function validateFoodSearchQuery(data: unknown) {
	return foodSearchQuerySchema.parse(data);
}

export function validateFoodSearchResponse(data: unknown) {
	return foodSearchResponseSchema.parse(data);
}

export function validateAiImageAnalysis(data: unknown) {
	return aiImageAnalysisSchema.parse(data);
}

export function validateEstimateMacros(data: unknown) {
	return estimateMacrosSchema.parse(data);
}

export function validateMacroEstimationResponse(data: unknown) {
	return macroEstimationResponseSchema.parse(data);
}

export function validateBulkDeleteMeals(data: unknown) {
	return bulkDeleteMealsSchema.parse(data);
}

export function validateBulkDeleteFavorites(data: unknown) {
	return bulkDeleteFavoritesSchema.parse(data);
}

// TypeScript type exports
export type CreateProfileRequest = z.infer<typeof createProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type CreateMealRequest = z.infer<typeof createMealSchema>;
export type UpdateMealRequest = z.infer<typeof updateMealSchema>;
export type MealsQuery = z.infer<typeof mealsQuerySchema>;
export type DailySummaryQuery = z.infer<typeof dailySummaryQuerySchema>;
export type StreakResponse = z.infer<typeof streakResponseSchema>;
export type StreakCalendarQuery = z.infer<typeof streakCalendarQuerySchema>;
export type FreezeRequest = z.infer<typeof freezeSchema>;
export type CreateFavoriteRequest = z.infer<typeof createFavoriteSchema>;
export type UpdateFavoriteRequest = z.infer<typeof updateFavoriteSchema>;
export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;
export type QuickAddFavoriteRequest = z.infer<typeof quickAddFavoriteSchema>;
export type QuickAddFavoriteResponse = z.infer<typeof quickAddFavoriteResponseSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type DailyAnalyticsQuery = z.infer<typeof dailyAnalyticsSchema>;
export type WeeklyAnalyticsQuery = z.infer<typeof weeklyAnalyticsSchema>;
export type MonthlyAnalyticsQuery = z.infer<typeof monthlyAnalyticsSchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
export type FoodSearchQuery = z.infer<typeof foodSearchQuerySchema>;
export type FoodSearchResponse = z.infer<typeof foodSearchResponseSchema>;
export type AiImageAnalysisResponse = z.infer<typeof aiImageAnalysisSchema>;
export type EstimateMacrosRequest = z.infer<typeof estimateMacrosSchema>;
export type MacroEstimationResponse = z.infer<typeof macroEstimationResponseSchema>;
export type BulkDeleteMealsRequest = z.infer<typeof bulkDeleteMealsSchema>;
export type BulkDeleteFavoritesRequest = z.infer<typeof bulkDeleteFavoritesSchema>;
