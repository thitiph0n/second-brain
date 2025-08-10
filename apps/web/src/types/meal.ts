export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'ai' | 'manual';
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface FoodEntry {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: MealType;
  entry_date: string; // YYYY-MM-DD
  source: FoodSource;
  ai_confidence?: number;
  original_description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodEntryRequest {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: MealType;
  entry_date?: string;
  source?: FoodSource;
  ai_confidence?: number;
  original_description?: string;
}

export interface UpdateFoodEntryRequest {
  food_name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  meal_type?: MealType;
  entry_date?: string;
  source?: FoodSource;
  ai_confidence?: number;
  original_description?: string;
}

export interface UserProfile {
  user_id: string;
  height_cm: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfileRequest {
  height_cm: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
}

export interface UpdateUserProfileRequest {
  height_cm?: number;
  age?: number;
  gender?: Gender;
  activity_level?: ActivityLevel;
}

export interface ProfileTracking {
  id: string;
  user_id: string;
  weight_kg?: number;
  muscle_mass_kg?: number;
  body_fat_percentage?: number;
  bmr_calories?: number;
  tdee_calories?: number;
  recorded_date: string;
  created_at: string;
}

export interface CreateProfileTrackingRequest {
  weight_kg?: number;
  muscle_mass_kg?: number;
  body_fat_percentage?: number;
  bmr_calories?: number;
  tdee_calories?: number;
  recorded_date?: string;
}

export interface FavoriteFood {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  category?: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFavoriteFoodRequest {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  category?: string;
}

export interface UpdateFavoriteFoodRequest {
  name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: string;
  category?: string;
}

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  entries: FoodEntry[];
  profile?: UserProfile;
  latest_tracking?: ProfileTracking;
  bmr_calories?: number;
  tdee_calories?: number;
  calorie_balance?: number;
}

// UI-specific types
export interface NutritionTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MacroPercentages {
  protein: number; // percentage of total calories
  carbs: number;   // percentage of total calories
  fat: number;     // percentage of total calories
}