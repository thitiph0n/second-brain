// TanStack Query hooks for meal-tracker data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mealTrackerAPI, mealTrackerUtils } from '@/api/meal-tracker';
import type {
  ProfileFormData,
  Meal,
  MealFormData,
  FavoriteFood,
  MealType
} from '@/types/meal-tracker';

// Profile API Hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['meal-tracker', 'profile'],
    queryFn: async () => {
      try {
        return await mealTrackerAPI.getProfile();
      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('not found') ||
          error.message.includes('404') ||
          error.message.includes('User profile not found')
        )) {
          console.log('Profile not found, returning null');
          return null; // Return null for 404s
        }
        throw error; // Re-throw other errors
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 404s
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileFormData) => mealTrackerAPI.createProfile(data),
    onSuccess: (profile) => {
      toast.success('Profile created successfully!');
      queryClient.setQueryData(['meal-tracker', 'profile'], profile);
    },
    onError: (error) => {
      toast.error(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileFormData) => mealTrackerAPI.updateProfile(data),
    onSuccess: (profile) => {
      toast.success('Profile updated successfully!');
      queryClient.setQueryData(['meal-tracker', 'profile'], profile);
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

// Meals API Hooks
export const useMeals = (options?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['meal-tracker', 'meals', options],
    queryFn: () => mealTrackerAPI.getMeals(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDailySummary = (date?: string) => {
  return useQuery({
    queryKey: ['meal-tracker', 'daily-summary', date],
    queryFn: () => mealTrackerAPI.getDailySummary(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MealFormData) => mealTrackerAPI.createMeal(data),
    onSuccess: () => {
      toast.success('Meal logged successfully!');
      // Invalidate meals and daily summary queries
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'streak'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'favorites'] });
    },
    onError: (error) => {
      toast.error(`Failed to log meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useUpdateMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MealFormData> }) =>
      mealTrackerAPI.updateMeal(id, data),
    onSuccess: () => {
      toast.success('Meal updated successfully!');
      // Invalidate meals and daily summary queries
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'daily-summary'] });
    },
    onError: (error) => {
      toast.error(`Failed to update meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mealId: string) => mealTrackerAPI.deleteMeal(mealId),
    onSuccess: () => {
      toast.success('Meal deleted successfully!');
      // Invalidate meals and daily summary queries
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'streak'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

// Streak API Hooks
export const useStreak = () => {
  return useQuery({
    queryKey: ['meal-tracker', 'streak'],
    queryFn: () => mealTrackerAPI.getStreak(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useStreakCalendar = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['meal-tracker', 'streak-calendar', year, month],
    queryFn: () => mealTrackerAPI.getStreakCalendar(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUseFreezeCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => mealTrackerAPI.useFreezeCredit(),
    onSuccess: () => {
      toast.success('Freeze credit used successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'streak'] });
    },
    onError: (error) => {
      toast.error(`Failed to use freeze credit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

// Favorites API Hooks
export const useFavorites = () => {
  return useQuery({
    queryKey: ['meal-tracker', 'favorites'],
    queryFn: () => mealTrackerAPI.getFavorites(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<FavoriteFood, 'id' | 'user_id' | 'usage_count' | 'last_used_at' | 'created_at' | 'updated_at'>) =>
      mealTrackerAPI.createFavorite(data),
    onSuccess: () => {
      toast.success('Favorite added successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'favorites'] });
    },
    onError: (error) => {
      toast.error(`Failed to add favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useUpdateFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FavoriteFood> }) =>
      mealTrackerAPI.updateFavorite(id, data),
    onSuccess: () => {
      toast.success('Favorite updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'favorites'] });
    },
    onError: (error) => {
      toast.error(`Failed to update favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useDeleteFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteId: string) => mealTrackerAPI.deleteFavorite(favoriteId),
    onSuccess: () => {
      toast.success('Favorite deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'favorites'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useLogFavoriteMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mealType }: { id: string; mealType: MealType }) =>
      mealTrackerAPI.logFavoriteMeal(id, mealType),
    onSuccess: () => {
      toast.success('Meal logged from favorite!');
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'streak'] });
      queryClient.invalidateQueries({ queryKey: ['meal-tracker', 'favorites'] });
    },
    onError: (error) => {
      toast.error(`Failed to log meal from favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

// Analytics API Hooks
export const useDailyAnalytics = (date?: string) => {
  return useQuery({
    queryKey: ['meal-tracker', 'analytics', 'daily', date],
    queryFn: () => mealTrackerAPI.getDailyAnalytics(date),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWeeklyAnalytics = (weeks?: number) => {
  return useQuery({
    queryKey: ['meal-tracker', 'analytics', 'weekly', weeks],
    queryFn: () => mealTrackerAPI.getWeeklyAnalytics(weeks),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useMonthlyAnalytics = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['meal-tracker', 'analytics', 'monthly', year, month],
    queryFn: () => mealTrackerAPI.getMonthlyAnalytics(year, month),
    staleTime: 20 * 60 * 1000, // 20 minutes
  });
};

export const useTrendsAnalytics = (period?: '7d' | '30d' | '90d', includeWeight?: boolean) => {
  return useQuery({
    queryKey: ['meal-tracker', 'analytics', 'trends', period, includeWeight],
    queryFn: () => mealTrackerAPI.getTrendsAnalytics(period, includeWeight),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Food Search API Hooks
export const useSearchFoods = (query: string, limit?: number) => {
  return useQuery({
    queryKey: ['meal-tracker', 'foods', 'search', query, limit],
    queryFn: () => mealTrackerAPI.searchFoods(query, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: query.length > 0,
  });
};

// Utility hooks
export const useProfileExists = () => {
  const { data: profile, isLoading, error } = useUserProfile();
  return { profile, isLoading, error, exists: !!profile };
};

// Optimistic updates utilities
export const mealTrackerOptimistic = {
  // Optimistic create meal
  optimisticCreateMeal: (client: ReturnType<typeof useQueryClient>, newMeal: Meal) => {
    client.setQueryData(['meal-tracker', 'meals'], (oldData: any) => {
      if (!oldData) return { meals: [newMeal], total: 1 };
      return {
        meals: [newMeal, ...oldData.meals],
        total: oldData.total + 1,
      };
    });

    // Update daily summary
    client.setQueryData(['meal-tracker', 'daily-summary'], (oldData: any) => {
      if (!oldData) {
        return {
          daily_summary: {
            date: mealTrackerUtils.formatDate(new Date()),
            total_calories: newMeal.calories,
            total_protein_g: newMeal.protein_g,
            total_carbs_g: newMeal.carbs_g,
            total_fat_g: newMeal.fat_g,
            meal_count: 1,
            target_calories: 0,
          },
        };
      }

      const summary = oldData.daily_summary;
      return {
        daily_summary: {
          ...summary,
          total_calories: summary.total_calories + newMeal.calories,
          total_protein_g: summary.total_protein_g + newMeal.protein_g,
          total_carbs_g: summary.total_carbs_g + newMeal.carbs_g,
          total_fat_g: summary.total_fat_g + newMeal.fat_g,
          meal_count: summary.meal_count + 1,
        },
      };
    });
  },

  // Optimistic delete meal
  optimisticDeleteMeal: (client: ReturnType<typeof useQueryClient>, deletedMeal: Meal) => {
    client.setQueryData(['meal-tracker', 'meals'], (oldData: any) => {
      if (!oldData) return { meals: [], total: 0 };
      return {
        meals: oldData.meals.filter((meal: Meal) => meal.id !== deletedMeal.id),
        total: Math.max(0, oldData.total - 1),
      };
    });

    // Update daily summary
    client.setQueryData(['meal-tracker', 'daily-summary'], (oldData: any) => {
      if (!oldData) return { daily_summary: null };

      const summary = oldData.daily_summary;
      if (!summary) return { daily_summary: null };

      const newSummary = {
        ...summary,
        total_calories: Math.max(0, summary.total_calories - deletedMeal.calories),
        total_protein_g: Math.max(0, summary.total_protein_g - deletedMeal.protein_g),
        total_carbs_g: Math.max(0, summary.total_carbs_g - deletedMeal.carbs_g),
        total_fat_g: Math.max(0, summary.total_fat_g - deletedMeal.fat_g),
        meal_count: Math.max(0, summary.meal_count - 1),
      };

      // Remove summary if no meals left
      if (newSummary.meal_count === 0) {
        return { daily_summary: null };
      }

      return { daily_summary: newSummary };
    });
  },

  // Optimistic add favorite
  optimisticAddFavorite: (client: ReturnType<typeof useQueryClient>, newFavorite: FavoriteFood) => {
    client.setQueryData(['meal-tracker', 'favorites'], (oldData: any) => {
      if (!oldData) return { favorites: [newFavorite] };
      return {
        favorites: [newFavorite, ...oldData.favorites],
      };
    });
  },

  // Optimistic delete favorite
  optimisticDeleteFavorite: (client: ReturnType<typeof useQueryClient>, deletedFavoriteId: string) => {
    client.setQueryData(['meal-tracker', 'favorites'], (oldData: any) => {
      if (!oldData) return { favorites: [] };
      return {
        favorites: oldData.favorites.filter((fav: FavoriteFood) => fav.id !== deletedFavoriteId),
      };
    });
  },
};