import { z } from 'zod';

// Enum schemas
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const foodSourceSchema = z.enum(['ai', 'manual']);
export const genderSchema = z.enum(['male', 'female']);
export const activityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']);

// Date validation helpers
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
const optionalDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional();

// Food Entry validation schemas
export const createFoodEntrySchema = z.object({
  foodName: z.string().min(1, 'Food name is required').max(200, 'Food name must be less than 200 characters'),
  calories: z.number().int().min(0, 'Calories must be non-negative').max(10000, 'Calories must be reasonable'),
  proteinG: z.number().min(0, 'Protein must be non-negative').max(1000, 'Protein must be reasonable').optional().default(0),
  carbsG: z.number().min(0, 'Carbs must be non-negative').max(1000, 'Carbs must be reasonable').optional().default(0),
  fatG: z.number().min(0, 'Fat must be non-negative').max(1000, 'Fat must be reasonable').optional().default(0),
  mealType: mealTypeSchema,
  entryDate: optionalDateStringSchema,
  source: foodSourceSchema.optional().default('manual'),
  aiConfidence: z.number().min(0).max(1).optional(),
  originalDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export const updateFoodEntrySchema = z.object({
  foodName: z.string().min(1, 'Food name is required').max(200, 'Food name must be less than 200 characters').optional(),
  calories: z.number().int().min(0, 'Calories must be non-negative').max(10000, 'Calories must be reasonable').optional(),
  proteinG: z.number().min(0, 'Protein must be non-negative').max(1000, 'Protein must be reasonable').optional(),
  carbsG: z.number().min(0, 'Carbs must be non-negative').max(1000, 'Carbs must be reasonable').optional(),
  fatG: z.number().min(0, 'Fat must be non-negative').max(1000, 'Fat must be reasonable').optional(),
  mealType: mealTypeSchema.optional(),
  entryDate: optionalDateStringSchema,
  source: foodSourceSchema.optional(),
  aiConfidence: z.number().min(0).max(1).optional(),
  originalDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

// Food Entry query validation
export const foodEntryQuerySchema = z.object({
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  mealType: mealTypeSchema.optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional().default('0'),
});

// User Profile validation schemas
export const createUserProfileSchema = z.object({
  heightCm: z.number().int().min(50, 'Height must be at least 50cm').max(300, 'Height must be less than 300cm'),
  age: z.number().int().min(1, 'Age must be at least 1').max(150, 'Age must be less than 150'),
  gender: genderSchema,
  activityLevel: activityLevelSchema,
});

export const updateUserProfileSchema = z.object({
  heightCm: z.number().int().min(50, 'Height must be at least 50cm').max(300, 'Height must be less than 300cm').optional(),
  age: z.number().int().min(1, 'Age must be at least 1').max(150, 'Age must be less than 150').optional(),
  gender: genderSchema.optional(),
  activityLevel: activityLevelSchema.optional(),
});

// Profile Tracking validation schemas
export const createProfileTrackingSchema = z.object({
  weightKg: z.number().min(20, 'Weight must be at least 20kg').max(500, 'Weight must be less than 500kg').optional(),
  muscleMassKg: z.number().min(0, 'Muscle mass must be non-negative').max(200, 'Muscle mass must be reasonable').optional(),
  bodyFatPercentage: z.number().min(0, 'Body fat percentage must be non-negative').max(100, 'Body fat percentage must be less than 100%').optional(),
  recordedDate: optionalDateStringSchema,
}).refine(
  (data) => data.weightKg !== undefined || data.muscleMassKg !== undefined || data.bodyFatPercentage !== undefined,
  'At least one measurement must be provided'
);

// Profile Tracking query validation
export const profileTrackingQuerySchema = z.object({
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional().default('0'),
});

// Favorite Foods validation schemas
export const createFavoriteFoodSchema = z.object({
  name: z.string().min(1, 'Food name is required').max(200, 'Food name must be less than 200 characters'),
  calories: z.number().int().min(0, 'Calories must be non-negative').max(10000, 'Calories must be reasonable'),
  proteinG: z.number().min(0, 'Protein must be non-negative').max(1000, 'Protein must be reasonable').optional().default(0),
  carbsG: z.number().min(0, 'Carbs must be non-negative').max(1000, 'Carbs must be reasonable').optional().default(0),
  fatG: z.number().min(0, 'Fat must be non-negative').max(1000, 'Fat must be reasonable').optional().default(0),
  servingSize: z.string().max(100, 'Serving size must be less than 100 characters').optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
});

export const updateFavoriteFoodSchema = z.object({
  name: z.string().min(1, 'Food name is required').max(200, 'Food name must be less than 200 characters').optional(),
  calories: z.number().int().min(0, 'Calories must be non-negative').max(10000, 'Calories must be reasonable').optional(),
  proteinG: z.number().min(0, 'Protein must be non-negative').max(1000, 'Protein must be reasonable').optional(),
  carbsG: z.number().min(0, 'Carbs must be non-negative').max(1000, 'Carbs must be reasonable').optional(),
  fatG: z.number().min(0, 'Fat must be non-negative').max(1000, 'Fat must be reasonable').optional(),
  servingSize: z.string().max(100, 'Serving size must be less than 100 characters').optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
});

// Favorite Foods query validation
export const favoriteFoodQuerySchema = z.object({
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional().default('0'),
});

// Daily nutrition date param validation
export const dailyNutritionDateSchema = z.object({
  date: dateStringSchema,
});

// URL param validation for IDs
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Type exports for request validation
export type CreateFoodEntryRequest = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryRequest = z.infer<typeof updateFoodEntrySchema>;
export type FoodEntryQueryRequest = z.infer<typeof foodEntryQuerySchema>;
export type CreateUserProfileRequest = z.infer<typeof createUserProfileSchema>;
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type CreateProfileTrackingRequest = z.infer<typeof createProfileTrackingSchema>;
export type ProfileTrackingQueryRequest = z.infer<typeof profileTrackingQuerySchema>;
export type CreateFavoriteFoodRequest = z.infer<typeof createFavoriteFoodSchema>;
export type UpdateFavoriteFoodRequest = z.infer<typeof updateFavoriteFoodSchema>;
export type FavoriteFoodQueryRequest = z.infer<typeof favoriteFoodQuerySchema>;
export type DailyNutritionDateRequest = z.infer<typeof dailyNutritionDateSchema>;
export type IdParamRequest = z.infer<typeof idParamSchema>;