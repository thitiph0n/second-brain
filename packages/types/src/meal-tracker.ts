// Meal Tracker Types

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type Goal = 'lose_weight' | 'maintain_weight' | 'gain_weight';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface UserProfile {
  userId: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  timezone?: string; // IANA timezone name (e.g., "Asia/Bangkok")
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  timezone?: string;
}

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: string;
  servingUnit?: string;
  imageUrl?: string | null;
  notes?: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealFormData {
  mealType: MealType;
  foodName: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  servingSize?: string;
  servingUnit?: string;
  imageUrl?: string | null;
  notes?: string;
  loggedAt?: string;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  mealCount: number;
  targetCalories: number;
}

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate?: string;
  freezeCredits: number;
  totalLoggedDays: number;
}

export interface FavoriteFood {
  id: string;
  userId: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: string;
  servingUnit?: string;
  category?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// Response types
export type ProfileResponse = Omit<UserProfile, 'userId'> & {
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
};

export type StreakResponse = Omit<Streak, 'userId'>;

export type FavoritesResponse = Array<Omit<FavoriteFood, 'userId'>>;

export type QuickAddFavoriteResponse = {
  meal: Omit<Meal, 'userId'>;
  favorite: {
    id: string;
    usageCount: number;
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