// Meal tracker types and interfaces

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'ai' | 'manual';
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Food Entry interfaces
export interface FoodEntry {
  id: string;
  userId: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealType: MealType;
  entryDate: string; // YYYY-MM-DD format
  source: FoodSource;
  aiConfidence?: number;
  originalDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodEntryCreateData {
  foodName: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  mealType: MealType;
  entryDate?: string;
  source?: FoodSource;
  aiConfidence?: number;
  originalDescription?: string;
}

export interface FoodEntryUpdateData {
  foodName?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  mealType?: MealType;
  entryDate?: string;
  source?: FoodSource;
  aiConfidence?: number;
  originalDescription?: string;
}

// User Profile interfaces
export interface UserProfile {
  userId: string;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileCreateData {
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface UserProfileUpdateData {
  heightCm?: number;
  age?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
}

// Profile Tracking interfaces
export interface ProfileTracking {
  id: string;
  userId: string;
  weightKg?: number;
  muscleMassKg?: number;
  bodyFatPercentage?: number;
  bmrCalories?: number;
  tdeeCalories?: number;
  recordedDate: string; // YYYY-MM-DD format
  createdAt: string;
}

export interface ProfileTrackingCreateData {
  weightKg?: number;
  muscleMassKg?: number;
  bodyFatPercentage?: number;
  recordedDate?: string;
}

// Favorite Foods interfaces
export interface FavoriteFood {
  id: string;
  userId: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: string;
  category?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteFoodCreateData {
  name: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  servingSize?: string;
  category?: string;
}

export interface FavoriteFoodUpdateData {
  name?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  servingSize?: string;
  category?: string;
}

// Daily Nutrition Summary interface
export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  mealBreakdown: {
    breakfast: NutritionBreakdown;
    lunch: NutritionBreakdown;
    dinner: NutritionBreakdown;
    snack: NutritionBreakdown;
  };
  entryCount: number;
}

export interface NutritionBreakdown {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  entryCount: number;
}

// Extended Profile with calculations
export interface ExtendedUserProfile extends UserProfile {
  currentWeight?: number;
  currentBmr?: number;
  currentTdee?: number;
  lastWeightRecord?: string;
  weightHistory: ProfileTracking[];
}

// BMR calculation result
export interface BMRCalculation {
  bmr: number;
  tdee: number;
}

// Query interfaces
export interface FoodEntryQuery {
  startDate?: string;
  endDate?: string;
  mealType?: MealType;
  limit?: number;
  offset?: number;
}

// MCP API Key interfaces
export interface MCPApiKey {
  id: string;
  userId: string;
  keyPrefix: string;
  name: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

// Type for returning a new key, as the full key is only shown once
export interface NewMCPApiKey extends MCPApiKey {
  apiKey: string;
}

export interface MCPApiKeyCreateData {
  name?: string;
}

export interface MCPApiKeyUpdateData {
  name?: string;
}

export interface ProfileTrackingQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface FavoriteFoodQuery {
  category?: string;
  limit?: number;
  offset?: number;
}