// Meal Tracker Types

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type Goal = 'lose_weight' | 'maintain_weight' | 'gain_weight';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface UserProfile {
  user_id: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: Gender;
  activity_level: ActivityLevel;
  goal: Goal;
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: Gender;
  activity_level: ActivityLevel;
  goal: Goal;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_type: MealType;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  serving_unit?: string;
  image_url?: string | null;
  notes?: string | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface MealFormData {
  meal_type: MealType;
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: string;
  serving_unit?: string;
  notes?: string;
  logged_at?: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_count: number;
  target_calories: number;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_logged_date?: string;
  freeze_credits: number;
  total_logged_days: number;
}

export interface FavoriteFood {
  id: string;
  user_id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  serving_unit?: string;
  category?: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// Response types
export type ProfileResponse = Omit<UserProfile, 'user_id'> & {
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
};

export type StreakResponse = Omit<Streak, 'user_id'>;

export type FavoritesResponse = Array<Omit<FavoriteFood, 'user_id'>>;

export type QuickAddFavoriteResponse = {
  meal: Omit<Meal, 'user_id'>;
  favorite: {
    id: string;
    usage_count: number;
  };
};

export interface FoodSearchResponse {
  id: string;
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g?: number;
  serving_description?: string;
  category?: string;
}

// Analytics types
export interface NutritionAnalytics {
  dailyBreakdown: DailySummary[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  averageCalories: number;
  goalAchievementRate: number;
  averageProteinRatio: number;
  averageCarbsRatio: number;
  averageFatRatio: number;
}

export interface MacroDistribution {
  idealDistribution: { protein: number; carbs: number; fat: number };
  actualDistribution: { protein: number; carbs: number; fat: number };
  deviation: { protein: number; carbs: number; fat: number };
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalCalories: number;
  averageDailyCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export interface Trends {
  calorieTrend: 'increasing' | 'decreasing' | 'stable';
  proteinTrend: 'increasing' | 'decreasing' | 'stable';
  consistencyScore: number;
}

export interface WeeklySummaries {
  weekSummaries: WeeklySummary[];
  trends: Trends;
}