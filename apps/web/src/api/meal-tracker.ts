// API client functions for meal-tracker endpoints
import type {
  UserProfile,
  ProfileFormData,
  Meal,
  MealFormData,
  Streak,
  FavoriteFood,
  DailySummary,
  Gender,
  ActivityLevel,
  Goal,
  MealType
} from '@/types/meal-tracker';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://2b.thitiphon.me' : 'http://localhost:8787');

class MealTrackerAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api/v1/meal-tracker${endpoint}`;

    // Get token from Zustand auth store
    const authData = localStorage.getItem("auth-storage");
    let token = null;

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.state?.accessToken;
      } catch (_e) {
        // Invalid JSON in storage
      }
    }

    if (!token) {
      throw new Error("No authentication token found");
    }

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Profile Endpoints
  async getProfile(): Promise<UserProfile | null> {
    try {
      const response = await this.request<{ profile: UserProfile }>('/profile');
      return response.profile;
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('not found') ||
        error.message.includes('404') ||
        error.message.includes('User profile not found')
      )) {
        console.log('Profile not found, returning null');
        return null; // Return null for 404s (profile doesn't exist)
      }
      console.error('Unexpected error in getProfile:', error);
      throw error; // Re-throw other errors
    }
  }

  async createProfile(data: ProfileFormData): Promise<UserProfile> {
    const response = await this.request<{ profile: UserProfile }>('/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.profile;
  }

  async updateProfile(data: ProfileFormData): Promise<UserProfile> {
    const response = await this.request<{ profile: UserProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.profile;
  }

  // Meal Management Endpoints
  async getMeals(options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ meals: Meal[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const endpoint = `/meals${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createMeal(data: MealFormData): Promise<Meal> {
    const response = await this.request<{ meal: Meal }>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.meal;
  }

  async updateMeal(id: string, data: Partial<MealFormData>): Promise<Meal> {
    const response = await this.request<{ meal: Meal }>(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.meal;
  }

  async deleteMeal(id: string): Promise<void> {
    await this.request(`/meals/${id}`, {
      method: 'DELETE',
    });
  }

  async getDailySummary(date?: string): Promise<{ dailySummary: DailySummary }> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const endpoint = `/meals/daily${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Streak Management Endpoints
  async getStreak(): Promise<{ streak: Streak }> {
    const response = await this.request<{ streak: Streak }>('/streak');
    return response;
  }

  async getStreakCalendar(year?: number, month?: number): Promise<{
    hasLoggedDays: string[];
    streakInfo: { current: number; longest: number; freezeCredits: number };
  }> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const endpoint = `/streak/calendar${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async useFreezeCredit(): Promise<{ message: string; freezeUsed: boolean }> {
    return this.request('/streak/freeze', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Favorite Foods Endpoints
  async getFavorites(): Promise<{ favorites: FavoriteFood[] }> {
    const response = await this.request<{ favorites: FavoriteFood[] }>('/favorites');
    return response;
  }

  async createFavorite(data: Omit<FavoriteFood, 'id' | 'userId' | 'usageCount' | 'lastUsedAt' | 'createdAt' | 'updatedAt'>): Promise<FavoriteFood> {
    const response = await this.request<{ favorite: FavoriteFood }>('/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.favorite;
  }

  async updateFavorite(id: string, data: Partial<FavoriteFood>): Promise<FavoriteFood> {
    const response = await this.request<{ favorite: FavoriteFood }>(`/favorites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.favorite;
  }

  async deleteFavorite(id: string): Promise<void> {
    await this.request(`/favorites/${id}`, {
      method: 'DELETE',
    });
  }

  async logFavoriteMeal(id: string, mealType: MealType): Promise<{
    meal: Meal;
    favorite: { id: string; usageCount: number };
  }> {
    const response = await this.request<{ data: { meal: Meal; favorite: { id: string; usageCount: number } } }>(`/favorites/${id}/log`, {
      method: 'POST',
      body: JSON.stringify({ mealType: mealType }),
    });
    return response.data;
  }

  // Analytics Endpoints
  async getDailyAnalytics(date?: string): Promise<{ analytics: any }> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const endpoint = `/analytics/daily${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getWeeklyAnalytics(weeks?: number): Promise<{ analytics: any }> {
    const params = new URLSearchParams();
    if (weeks) params.append('weeks', weeks.toString());

    const endpoint = `/analytics/weekly${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getMonthlyAnalytics(year?: number, month?: number): Promise<{ analytics: any }> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const endpoint = `/analytics/monthly${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getTrendsAnalytics(period?: '7d' | '30d' | '90d', includeWeight?: boolean): Promise<{ trends: any }> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (includeWeight) params.append('include_weight', 'true');

    const endpoint = `/analytics/trends${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Food Search Endpoints
  async searchFoods(query: string, limit?: number): Promise<{ foods: any[] }> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (limit) params.append('limit', limit.toString());

    const endpoint = `/foods/search?${params.toString()}`;
    return this.request(endpoint);
  }

  async estimateMacros(data: {
    foodName: string;
    servingSize?: string;
    servingUnit?: string;
    notes?: string;
  }): Promise<{
    estimation: {
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning?: string;
    };
  }> {
    const payload = {
      foodName: data.foodName,
      servingSize: data.servingSize || undefined,
      servingUnit: data.servingUnit || undefined,
      notes: data.notes || undefined,
    };

    return this.request('/foods/estimate-macros', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async analyzeImage(imageFile: File): Promise<{
    foodName: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    servingSize?: string;
    servingUnit?: string;
    confidence: 'high' | 'medium' | 'low';
    description?: string;
  }> {
    const url = `${API_BASE_URL}/api/v1/meal-tracker/foods/analyze-image`;

    const authData = localStorage.getItem("auth-storage");
    let token = null;

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.state?.accessToken;
      } catch (_e) {
        // Invalid JSON in storage
      }
    }

    if (!token) {
      throw new Error("No authentication token found");
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed for image analysis:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mealTrackerAPI = new MealTrackerAPI();

// Export utility functions for common operations
export const mealTrackerUtils = {
  // Calculate TDEE using Mifflin-St Jeor equation
  calculateTDEE(weightKg: number, heightCm: number, age: number, gender: Gender, activityLevel: ActivityLevel, goal: Goal): {
    tdee: number;
    targetCalories: number;
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
  } {
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    };

    const goalAdjustments = {
      lose_weight: -500,
      maintain_weight: 0,
      gain_weight: 500,
    };

    // BMR calculation using Mifflin-St Jeor equation
    const genderFactor = gender === 'male' ? 5 : -161;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderFactor;
    const activityMultiplier = activityMultipliers[activityLevel];
    const goalAdjustment = goalAdjustments[goal];

    const tdee = Math.round((bmr * activityMultiplier) + goalAdjustment);

    // Macro targets calculation
    const targetProteinG = Math.round(weightKg * 2); // 2g per kg body weight
    const fatCaloriesRatio = gender === 'male' ? 0.3 : 0.35; // 30% for men, 35% for women
    const fatCalories = Math.round(tdee * fatCaloriesRatio);
    const targetFatG = Math.round(fatCalories / 9);
    const proteinCalories = targetProteinG * 4;
    const remainingCalories = tdee - proteinCalories - fatCalories;
    const targetCarbsG = Math.round(remainingCalories / 4);

    return {
      tdee,
      targetCalories: tdee,
      targetProteinG: targetProteinG,
      targetCarbsG: targetCarbsG,
      targetFatG: targetFatG,
    };
  },

  // Format date for API requests
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },

  // Calculate daily summary from meals
  calculateDailySummary(meals: Meal[], targetCalories: number = 0): DailySummary {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(meal => meal.loggedAt.split('T')[0] === today);

    return {
      date: today,
      totalCalories: todayMeals.reduce((sum, meal) => sum + meal.calories, 0),
      totalProteinG: todayMeals.reduce((sum, meal) => sum + meal.proteinG, 0),
      totalCarbsG: todayMeals.reduce((sum, meal) => sum + meal.carbsG, 0),
      totalFatG: todayMeals.reduce((sum, meal) => sum + meal.fatG, 0),
      mealCount: todayMeals.length,
      targetCalories: targetCalories,
    };
  },

  // Calculate streak from meals
  calculateStreak(meals: Meal[]): {
    currentStreak: number;
    longestStreak: number;
    totalLoggedDays: number;
    lastLoggedDate?: string;
  } {
    if (meals.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalLoggedDays: 0,
      };
    }

    // Get unique logged dates
    const loggedDates = new Set(
      meals.map(meal => meal.loggedAt.split('T')[0])
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

    const lastLoggedDate = Array.from(loggedDates).sort().pop();
    const sortedDates = Array.from(loggedDates).sort();
    let longestStreak = currentStreak;

    // Calculate longest streak by checking all possible streaks
    for (let i = 0; i < sortedDates.length; i++) {
      let streak = 1;
      let checkDate = new Date(sortedDates[i]);

      while (true) {
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        if (loggedDates.has(nextDateStr)) {
          streak++;
          checkDate = nextDate;
        } else {
          break;
        }
      }

      if (streak > longestStreak) {
        longestStreak = streak;
      }
    }

    return {
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      totalLoggedDays: loggedDates.size,
      lastLoggedDate: lastLoggedDate,
    };
  },
};