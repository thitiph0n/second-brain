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
  image_url?: string;
  notes?: string;
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
  logged_at?: Date;
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
  last_logged_date: string;
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

export interface NutritionSuggestion {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
}
