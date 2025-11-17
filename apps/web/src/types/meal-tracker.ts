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
  timezone?: string;
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
  imageUrl?: string;
  notes?: string;
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
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionSuggestion {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number;
}

export interface TrendsAnalytics {
  nutrition: {
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
  };
  macroDistribution: {
    idealDistribution: { protein: number; carbs: number; fat: number };
    actualDistribution: { protein: number; carbs: number; fat: number };
    deviation: { protein: number; carbs: number; fat: number };
  };
  weeklyTrends: {
    weekSummaries: Array<{
      weekStart: string;
      weekEnd: string;
      totalCalories: number;
      averageDailyCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      mealCount: number;
    }>;
    trends: {
      calorieTrend: 'increasing' | 'decreasing' | 'stable';
      proteinTrend: 'increasing' | 'decreasing' | 'stable';
      consistencyScore: number;
    };
  };
  period: '7d' | '14d' | '30d' | '90d';
}
