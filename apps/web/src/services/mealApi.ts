import type {
  FoodEntry,
  CreateFoodEntryRequest,
  UpdateFoodEntryRequest,
  UserProfile,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  ProfileTracking,
  CreateProfileTrackingRequest,
  FavoriteFood,
  CreateFavoriteFoodRequest,
  UpdateFavoriteFoodRequest,
  DailyNutritionSummary,
} from '@/types/meal';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://2b.thitiphon.me' : 'http://localhost:8787');

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Get token from Zustand auth store
  const authData = localStorage.getItem('auth-storage');
  let token = null;

  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.state?.accessToken;
    } catch (e) {
      // Invalid JSON in storage
    }
  }

  if (!token) {
    throw new ApiError(401, 'No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: 'Failed to parse error response' };
    }

    // Create detailed error message
    let errorMessage = errorData.error || 'Request failed';
    if (errorData.details) {
      errorMessage += ` - ${errorData.details}`;
    }
    if (errorData.timestamp) {
      errorMessage += ` (${errorData.timestamp})`;
    }

    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
}

export const mealApi = {
  // Food Entries
  async getFoodEntries(date?: string): Promise<{ entries: FoodEntry[] }> {
    const queryParams = date ? `?date=${date}` : '';
    return fetchWithAuth(`/meal/food-entries${queryParams}`);
  },

  async createFoodEntry(data: CreateFoodEntryRequest): Promise<{ entry: FoodEntry }> {
    return fetchWithAuth('/meal/food-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getFoodEntry(id: string): Promise<{ entry: FoodEntry }> {
    return fetchWithAuth(`/meal/food-entries/${id}`);
  },

  async updateFoodEntry(
    id: string,
    data: UpdateFoodEntryRequest
  ): Promise<{ entry: FoodEntry }> {
    return fetchWithAuth(`/meal/food-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFoodEntry(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/meal/food-entries/${id}`, {
      method: 'DELETE',
    });
  },

  // Daily Nutrition
  async getDailyNutrition(date: string): Promise<DailyNutritionSummary> {
    return fetchWithAuth(`/meal/nutrition/daily/${date}`);
  },

  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    return fetchWithAuth('/meal/profile');
  },

  async createUserProfile(data: CreateUserProfileRequest): Promise<{ profile: UserProfile }> {
    return fetchWithAuth('/meal/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUserProfile(data: UpdateUserProfileRequest): Promise<{ profile: UserProfile }> {
    return fetchWithAuth('/meal/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Profile Tracking
  async getProfileHistory(): Promise<{ history: ProfileTracking[] }> {
    return fetchWithAuth('/meal/profile/history');
  },

  async createProfileTracking(data: CreateProfileTrackingRequest): Promise<{ tracking: ProfileTracking }> {
    return fetchWithAuth('/meal/profile/history', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Favorite Foods
  async getFavoriteFoods(): Promise<{ favorites: FavoriteFood[] }> {
    return fetchWithAuth('/meal/favorite-foods');
  },

  async createFavoriteFood(data: CreateFavoriteFoodRequest): Promise<{ favorite: FavoriteFood }> {
    return fetchWithAuth('/meal/favorite-foods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getFavoriteFood(id: string): Promise<{ favorite: FavoriteFood }> {
    return fetchWithAuth(`/meal/favorite-foods/${id}`);
  },

  async updateFavoriteFood(
    id: string,
    data: UpdateFavoriteFoodRequest
  ): Promise<{ favorite: FavoriteFood }> {
    return fetchWithAuth(`/meal/favorite-foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFavoriteFood(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/meal/favorite-foods/${id}`, {
      method: 'DELETE',
    });
  },

  async addFavoriteToLog(id: string, mealType: string): Promise<{ entry: FoodEntry }> {
    return fetchWithAuth(`/meal/favorite-foods/${id}/add-to-log`, {
      method: 'POST',
      body: JSON.stringify({ mealType }),
    });
  },
};

export { ApiError };