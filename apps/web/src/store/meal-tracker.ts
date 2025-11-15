// Mock data and state management for Meal Tracker (no API integration)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, Meal, Streak, FavoriteFood, MealFormData, ProfileFormData } from '@/types/meal-tracker';

interface MealTrackerState {
  // Profile
  profile: UserProfile | null;
  setProfile: (data: ProfileFormData) => void;

  // Meals
  meals: Meal[];
  addMeal: (meal: MealFormData) => void;
  updateMeal: (id: string, meal: Partial<MealFormData>) => void;
  deleteMeal: (id: string) => void;

  // Streak
  streak: Streak | null;
  updateStreak: () => void;

  // Favorites
  favorites: FavoriteFood[];
  addFavorite: (food: Omit<FavoriteFood, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at'>) => void;
  deleteFavorite: (id: string) => void;
  addMealFromFavorite: (favoriteId: string, mealType: MealFormData['meal_type']) => void;
}

// TDEE Calculation using Mifflin-St Jeor equation
function calculateTDEE(profile: ProfileFormData): {
  tdee: number;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
} {
  const { age, weight_kg, height_cm, gender, activity_level, goal } = profile;

  // Basal Metabolic Rate (BMR)
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  const tdee = bmr * activityMultipliers[activity_level];

  // Goal adjustments
  let target_calories = tdee;
  if (goal === 'lose_weight') {
    target_calories -= 500;
  } else if (goal === 'gain_weight') {
    target_calories += 500;
  }

  // Macro targets
  const target_protein_g = weight_kg * 2; // 2g per kg body weight
  const fat_calories = target_calories * 0.30; // 30% from fat
  const target_fat_g = fat_calories / 9; // 9 calories per gram of fat
  const protein_calories = target_protein_g * 4; // 4 calories per gram of protein
  const carb_calories = target_calories - protein_calories - fat_calories;
  const target_carbs_g = carb_calories / 4; // 4 calories per gram of carbs

  return {
    tdee: Math.round(tdee),
    target_calories: Math.round(target_calories),
    target_protein_g: Math.round(target_protein_g),
    target_carbs_g: Math.round(target_carbs_g),
    target_fat_g: Math.round(target_fat_g),
  };
}

export const useMealTracker = create<MealTrackerState>()(
  persist(
    (set, get) => ({
      // Profile
      profile: null,
      setProfile: (data: ProfileFormData) => {
        const calculations = calculateTDEE(data);
        const profile: UserProfile = {
          user_id: 'mock-user-id',
          ...data,
          ...calculations,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set({ profile });
      },

      // Meals
      meals: [],
      addMeal: (mealData: MealFormData) => {
        const meal: Meal = {
          id: `meal-${Date.now()}`,
          user_id: 'mock-user-id',
          meal_type: mealData.meal_type,
          food_name: mealData.food_name,
          calories: mealData.calories,
          protein_g: mealData.protein_g || 0,
          carbs_g: mealData.carbs_g || 0,
          fat_g: mealData.fat_g || 0,
          serving_size: mealData.serving_size,
          serving_unit: mealData.serving_unit,
          notes: mealData.notes,
          logged_at: mealData.logged_at?.toISOString() || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          meals: [...state.meals, meal],
        }));
        get().updateStreak();
      },

      updateMeal: (id: string, mealData: Partial<MealFormData>) => {
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === id
              ? {
                  ...meal,
                  food_name: mealData.food_name ?? meal.food_name,
                  meal_type: mealData.meal_type ?? meal.meal_type,
                  calories: mealData.calories ?? meal.calories,
                  protein_g: mealData.protein_g ?? meal.protein_g,
                  carbs_g: mealData.carbs_g ?? meal.carbs_g,
                  fat_g: mealData.fat_g ?? meal.fat_g,
                  serving_size: mealData.serving_size ?? meal.serving_size,
                  serving_unit: mealData.serving_unit ?? meal.serving_unit,
                  notes: mealData.notes ?? meal.notes,
                  updated_at: new Date().toISOString(),
                }
              : meal
          ),
        }));
      },

      deleteMeal: (id: string) => {
        set((state) => ({
          meals: state.meals.filter((meal) => meal.id !== id),
        }));
      },

      // Streak
      streak: null,
      updateStreak: () => {
        const { meals, streak } = get();
        const today = new Date().toISOString().split('T')[0];
        const hasLoggedToday = meals.some((meal) =>
          meal.logged_at.split('T')[0] === today
        );

        if (!hasLoggedToday) {
          return;
        }

        // Get unique logged dates
        const loggedDates = new Set(
          meals.map((meal) => meal.logged_at.split('T')[0])
        );

        // Calculate current streak
        let currentStreak = 0;
        let checkDate = new Date();
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (loggedDates.has(dateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        const newStreak: Streak = {
          user_id: 'mock-user-id',
          current_streak: currentStreak,
          longest_streak: Math.max(currentStreak, streak?.longest_streak || 0),
          last_logged_date: today,
          freeze_credits: streak?.freeze_credits || 2,
          total_logged_days: loggedDates.size,
        };

        set({ streak: newStreak });
      },

      // Favorites
      favorites: [],
      addFavorite: (food) => {
        const favorite: FavoriteFood = {
          id: `fav-${Date.now()}`,
          user_id: 'mock-user-id',
          food_name: food.food_name,
          calories: food.calories,
          protein_g: food.protein_g,
          carbs_g: food.carbs_g,
          fat_g: food.fat_g,
          serving_size: food.serving_size,
          serving_unit: food.serving_unit,
          category: food.category,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          favorites: [...state.favorites, favorite],
        }));
      },

      deleteFavorite: (id: string) => {
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== id),
        }));
      },

      addMealFromFavorite: (favoriteId: string, mealType: MealFormData['meal_type']) => {
        const { favorites, addMeal } = get();
        const favorite = favorites.find((f) => f.id === favoriteId);
        if (!favorite) return;

        // Add meal from favorite
        addMeal({
          meal_type: mealType,
          food_name: favorite.food_name,
          calories: favorite.calories,
          protein_g: favorite.protein_g,
          carbs_g: favorite.carbs_g,
          fat_g: favorite.fat_g,
          serving_size: favorite.serving_size,
          serving_unit: favorite.serving_unit,
        });

        // Update favorite usage count
        set((state) => ({
          favorites: state.favorites.map((fav) =>
            fav.id === favoriteId
              ? {
                  ...fav,
                  usage_count: fav.usage_count + 1,
                  last_used_at: new Date().toISOString(),
                }
              : fav
          ),
        }));
      },
    }),
    {
      name: 'meal-tracker-storage',
    }
  )
);
