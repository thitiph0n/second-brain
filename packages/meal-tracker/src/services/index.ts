import {
  FoodEntry,
  UserProfile,
  ProfileTracking,
  FavoriteFood,
  DailyNutritionSummary,
  NutritionBreakdown,
  ExtendedUserProfile,
  BMRCalculation,
  ActivityLevel,
  Gender,
} from '../types';

import {
  CreateFoodEntryRequest,
  UpdateFoodEntryRequest,
  FoodEntryQueryRequest,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  CreateProfileTrackingRequest,
  ProfileTrackingQueryRequest,
  CreateFavoriteFoodRequest,
  UpdateFavoriteFoodRequest,
  FavoriteFoodQueryRequest,
} from '../validation';

export class MealTrackerService {
  constructor(private db: D1Database) {}

  // Helper methods for database initialization and data transformation
  private async ensureDatabaseInitialized(): Promise<void> {
    try {
      // Check if food_entries table exists by attempting a simple query
      await this.db.prepare('SELECT COUNT(*) FROM food_entries LIMIT 1').first();
    } catch (error) {
      console.error('Database error - meal tracker tables may not exist:', error);
      throw new Error(`Database initialization error: ${error instanceof Error ? error.message : 'Unknown database error'}`);
    }
  }

  private transformFoodEntryFromDb(rawEntry: any): FoodEntry {
    return {
      id: rawEntry.id,
      userId: rawEntry.user_id,
      foodName: rawEntry.food_name,
      calories: rawEntry.calories,
      proteinG: rawEntry.protein_g || 0,
      carbsG: rawEntry.carbs_g || 0,
      fatG: rawEntry.fat_g || 0,
      mealType: rawEntry.meal_type,
      entryDate: rawEntry.entry_date,
      source: rawEntry.source || 'manual',
      aiConfidence: rawEntry.ai_confidence,
      originalDescription: rawEntry.original_description,
      createdAt: rawEntry.created_at,
      updatedAt: rawEntry.updated_at,
    };
  }

  private transformUserProfileFromDb(rawProfile: any): UserProfile {
    return {
      userId: rawProfile.user_id,
      heightCm: rawProfile.height_cm,
      age: rawProfile.age,
      gender: rawProfile.gender,
      activityLevel: rawProfile.activity_level,
      createdAt: rawProfile.created_at,
      updatedAt: rawProfile.updated_at,
    };
  }

  private transformProfileTrackingFromDb(rawTracking: any): ProfileTracking {
    return {
      id: rawTracking.id,
      userId: rawTracking.user_id,
      weightKg: rawTracking.weight_kg,
      muscleMassKg: rawTracking.muscle_mass_kg,
      bodyFatPercentage: rawTracking.body_fat_percentage,
      bmrCalories: rawTracking.bmr_calories,
      tdeeCalories: rawTracking.tdee_calories,
      recordedDate: rawTracking.recorded_date,
      createdAt: rawTracking.created_at,
    };
  }

  private transformFavoriteFoodFromDb(rawFood: any): FavoriteFood {
    return {
      id: rawFood.id,
      userId: rawFood.user_id,
      name: rawFood.name,
      calories: rawFood.calories,
      proteinG: rawFood.protein_g || 0,
      carbsG: rawFood.carbs_g || 0,
      fatG: rawFood.fat_g || 0,
      servingSize: rawFood.serving_size,
      category: rawFood.category,
      usageCount: rawFood.usage_count || 0,
      lastUsedAt: rawFood.last_used_at,
      createdAt: rawFood.created_at,
      updatedAt: rawFood.updated_at,
    };
  }

  // BMR and TDEE calculations using Mifflin-St Jeor equation
  calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
    let bmr: number;
    
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
    
    return Math.round(bmr);
  }

  calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const activityMultipliers = {
      sedentary: 1.2,      // Little to no exercise
      light: 1.375,        // Light exercise/sports 1-3 days/week
      moderate: 1.55,      // Moderate exercise/sports 3-5 days/week
      active: 1.725,       // Hard exercise/sports 6-7 days a week
      very_active: 1.9,    // Very hard exercise/sports & physical job
    };
    
    return Math.round(bmr * activityMultipliers[activityLevel]);
  }

  private calculateBMRAndTDEE(profile: UserProfile, weightKg: number): BMRCalculation {
    const bmr = this.calculateBMR(weightKg, profile.heightCm, profile.age, profile.gender);
    const tdee = this.calculateTDEE(bmr, profile.activityLevel);
    
    return { bmr, tdee };
  }

  // Food Entry CRUD operations
  async createFoodEntry(userId: string, data: CreateFoodEntryRequest): Promise<FoodEntry> {
    try {
      await this.ensureDatabaseInitialized();
      
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const entryDate = data.entryDate || new Date().toISOString().split('T')[0];

      const result = await this.db
        .prepare(
          `INSERT INTO food_entries (
            id, user_id, food_name, calories, protein_g, carbs_g, fat_g,
            meal_type, entry_date, source, ai_confidence, original_description,
            created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
          RETURNING *`
        )
        .bind(
          id, userId, data.foodName, data.calories, data.proteinG || 0,
          data.carbsG || 0, data.fatG || 0, data.mealType, entryDate,
          data.source || 'manual', data.aiConfidence || null, 
          data.originalDescription || null, now, now
        )
        .first<any>();

      if (!result) {
        throw new Error('Database returned empty result when creating food entry');
      }

      return this.transformFoodEntryFromDb(result);
    } catch (error) {
      console.error('Error in createFoodEntry:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create food entry: ${error.message}`);
      }
      throw new Error('Failed to create food entry: Unknown error occurred');
    }
  }

  async getFoodEntries(userId: string, query: Partial<FoodEntryQueryRequest> = {}): Promise<FoodEntry[]> {
    try {
      await this.ensureDatabaseInitialized();
      
      let sql = 'SELECT * FROM food_entries WHERE user_id = ?1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (query.startDate) {
        sql += ` AND entry_date >= ?${paramIndex}`;
        params.push(query.startDate);
        paramIndex++;
      }

      if (query.endDate) {
        sql += ` AND entry_date <= ?${paramIndex}`;
        params.push(query.endDate);
        paramIndex++;
      }

      if (query.mealType) {
        sql += ` AND meal_type = ?${paramIndex}`;
        params.push(query.mealType);
        paramIndex++;
      }

      sql += ' ORDER BY entry_date DESC, created_at DESC';

      if (query.limit) {
        sql += ` LIMIT ?${paramIndex}`;
        params.push(query.limit);
        paramIndex++;
      }

      if (query.offset) {
        sql += ` OFFSET ?${paramIndex}`;
        params.push(query.offset);
      }

      const result = await this.db.prepare(sql).bind(...params).all<any>();

      if (!result.success) {
        throw new Error(`Database query failed: ${result.error || 'Unknown database error'}`);
      }

      return (result.results || []).map(entry => this.transformFoodEntryFromDb(entry));
    } catch (error) {
      console.error('Error in getFoodEntries:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch food entries: ${error.message}`);
      }
      throw new Error('Failed to fetch food entries: Unknown error occurred');
    }
  }

  async getFoodEntryById(id: string, userId: string): Promise<FoodEntry | null> {
    try {
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('SELECT * FROM food_entries WHERE id = ?1 AND user_id = ?2')
        .bind(id, userId)
        .first<any>();

      return result ? this.transformFoodEntryFromDb(result) : null;
    } catch (error) {
      console.error('Error in getFoodEntryById:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch food entry: ${error.message}`);
      }
      throw new Error('Failed to fetch food entry: Unknown error occurred');
    }
  }

  async updateFoodEntry(id: string, userId: string, data: UpdateFoodEntryRequest): Promise<FoodEntry | null> {
    try {
      await this.ensureDatabaseInitialized();
      
      const existingEntry = await this.getFoodEntryById(id, userId);
      if (!existingEntry) {
        return null;
      }

      const now = new Date().toISOString();

      const result = await this.db
        .prepare(
          `UPDATE food_entries 
           SET food_name = COALESCE(?3, food_name),
               calories = COALESCE(?4, calories),
               protein_g = COALESCE(?5, protein_g),
               carbs_g = COALESCE(?6, carbs_g),
               fat_g = COALESCE(?7, fat_g),
               meal_type = COALESCE(?8, meal_type),
               entry_date = COALESCE(?9, entry_date),
               source = COALESCE(?10, source),
               ai_confidence = COALESCE(?11, ai_confidence),
               original_description = COALESCE(?12, original_description),
               updated_at = ?13
           WHERE id = ?1 AND user_id = ?2
           RETURNING *`
        )
        .bind(
          id, userId, data.foodName || null, data.calories || null,
          data.proteinG !== undefined ? data.proteinG : null,
          data.carbsG !== undefined ? data.carbsG : null,
          data.fatG !== undefined ? data.fatG : null,
          data.mealType || null, data.entryDate || null, data.source || null,
          data.aiConfidence !== undefined ? data.aiConfidence : null,
          data.originalDescription !== undefined ? data.originalDescription : null,
          now
        )
        .first<any>();

      return result ? this.transformFoodEntryFromDb(result) : null;
    } catch (error) {
      console.error('Error in updateFoodEntry:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update food entry: ${error.message}`);
      }
      throw new Error('Failed to update food entry: Unknown error occurred');
    }
  }

  async deleteFoodEntry(id: string, userId: string): Promise<boolean> {
    try {
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('DELETE FROM food_entries WHERE id = ?1 AND user_id = ?2')
        .bind(id, userId)
        .run();

      if (!result.success) {
        throw new Error(`Database delete failed: ${result.error || 'Unknown database error'}`);
      }

      return result.meta.changes > 0;
    } catch (error) {
      console.error('Error in deleteFoodEntry:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete food entry: ${error.message}`);
      }
      throw new Error('Failed to delete food entry: Unknown error occurred');
    }
  }

  // Daily Nutrition Summary
  async getDailyNutritionSummary(userId: string, date: string): Promise<DailyNutritionSummary> {
    try {
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare(
          `SELECT 
            meal_type,
            SUM(calories) as total_calories,
            SUM(protein_g) as total_protein,
            SUM(carbs_g) as total_carbs,
            SUM(fat_g) as total_fat,
            COUNT(*) as entry_count
          FROM food_entries 
          WHERE user_id = ?1 AND entry_date = ?2
          GROUP BY meal_type`
        )
        .bind(userId, date)
        .all<any>();

      if (!result.success) {
        throw new Error(`Database query failed: ${result.error || 'Unknown database error'}`);
      }

      const mealBreakdown = {
        breakfast: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 },
        lunch: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 },
        dinner: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 },
        snack: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 },
      };

      let totalCalories = 0;
      let totalProteinG = 0;
      let totalCarbsG = 0;
      let totalFatG = 0;
      let totalEntryCount = 0;

      (result.results || []).forEach((row: any) => {
        const mealType = row.meal_type as keyof typeof mealBreakdown;
        if (mealBreakdown[mealType]) {
          mealBreakdown[mealType] = {
            calories: row.total_calories || 0,
            proteinG: row.total_protein || 0,
            carbsG: row.total_carbs || 0,
            fatG: row.total_fat || 0,
            entryCount: row.entry_count || 0,
          };

          totalCalories += row.total_calories || 0;
          totalProteinG += row.total_protein || 0;
          totalCarbsG += row.total_carbs || 0;
          totalFatG += row.total_fat || 0;
          totalEntryCount += row.entry_count || 0;
        }
      });

      return {
        date,
        totalCalories,
        totalProteinG,
        totalCarbsG,
        totalFatG,
        mealBreakdown,
        entryCount: totalEntryCount,
      };
    } catch (error) {
      console.error('Error in getDailyNutritionSummary:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get daily nutrition summary: ${error.message}`);
      }
      throw new Error('Failed to get daily nutrition summary: Unknown error occurred');
    }
  }

  // User Profile operations
  async createUserProfile(userId: string, data: CreateUserProfileRequest): Promise<UserProfile> {
    try {
      await this.ensureDatabaseInitialized();
      
      const now = new Date().toISOString();

      const result = await this.db
        .prepare(
          `INSERT INTO user_profiles (user_id, height_cm, age, gender, activity_level, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           RETURNING *`
        )
        .bind(userId, data.heightCm, data.age, data.gender, data.activityLevel, now, now)
        .first<any>();

      if (!result) {
        throw new Error('Database returned empty result when creating user profile');
      }

      return this.transformUserProfileFromDb(result);
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
      throw new Error('Failed to create user profile: Unknown error occurred');
    }
  }

  async getUserProfile(userId: string): Promise<ExtendedUserProfile | null> {
    try {
      await this.ensureDatabaseInitialized();
      
      const profileResult = await this.db
        .prepare('SELECT * FROM user_profiles WHERE user_id = ?1')
        .bind(userId)
        .first<any>();

      if (!profileResult) {
        return null;
      }

      const profile = this.transformUserProfileFromDb(profileResult);

      // Get latest weight record
      const latestTrackingResult = await this.db
        .prepare(
          `SELECT * FROM profile_tracking 
           WHERE user_id = ?1 AND weight_kg IS NOT NULL
           ORDER BY recorded_date DESC, created_at DESC 
           LIMIT 1`
        )
        .bind(userId)
        .first<any>();

      // Get weight history (last 30 records)
      const historyResult = await this.db
        .prepare(
          `SELECT * FROM profile_tracking 
           WHERE user_id = ?1 
           ORDER BY recorded_date DESC, created_at DESC 
           LIMIT 30`
        )
        .bind(userId)
        .all<any>();

      const weightHistory = historyResult.success 
        ? (historyResult.results || []).map(record => this.transformProfileTrackingFromDb(record))
        : [];

      let currentWeight: number | undefined;
      let currentBmr: number | undefined;
      let currentTdee: number | undefined;
      let lastWeightRecord: string | undefined;

      if (latestTrackingResult && latestTrackingResult.weight_kg) {
        currentWeight = latestTrackingResult.weight_kg;
        lastWeightRecord = latestTrackingResult.recorded_date;
        
        const calculations = this.calculateBMRAndTDEE(profile, latestTrackingResult.weight_kg);
        currentBmr = calculations.bmr;
        currentTdee = calculations.tdee;
      }

      return {
        ...profile,
        currentWeight,
        currentBmr,
        currentTdee,
        lastWeightRecord,
        weightHistory,
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }
      throw new Error('Failed to fetch user profile: Unknown error occurred');
    }
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<UserProfile | null> {
    try {
      await this.ensureDatabaseInitialized();
      
      const existingProfile = await this.getUserProfile(userId);
      if (!existingProfile) {
        return null;
      }

      const now = new Date().toISOString();

      const result = await this.db
        .prepare(
          `UPDATE user_profiles 
           SET height_cm = COALESCE(?2, height_cm),
               age = COALESCE(?3, age),
               gender = COALESCE(?4, gender),
               activity_level = COALESCE(?5, activity_level),
               updated_at = ?6
           WHERE user_id = ?1
           RETURNING *`
        )
        .bind(
          userId, data.heightCm || null, data.age || null,
          data.gender || null, data.activityLevel || null, now
        )
        .first<any>();

      return result ? this.transformUserProfileFromDb(result) : null;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
      }
      throw new Error('Failed to update user profile: Unknown error occurred');
    }
  }

  // Profile Tracking operations
  async createProfileTracking(userId: string, data: CreateProfileTrackingRequest): Promise<ProfileTracking> {
    try {
      await this.ensureDatabaseInitialized();
      
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const recordedDate = data.recordedDate || new Date().toISOString().split('T')[0];

      let bmrCalories: number | null = null;
      let tdeeCalories: number | null = null;

      // If weight is provided, calculate BMR and TDEE
      if (data.weightKg) {
        const profile = await this.getUserProfile(userId);
        if (profile) {
          const calculations = this.calculateBMRAndTDEE(profile, data.weightKg);
          bmrCalories = calculations.bmr;
          tdeeCalories = calculations.tdee;
        }
      }

      const result = await this.db
        .prepare(
          `INSERT INTO profile_tracking (
            id, user_id, weight_kg, muscle_mass_kg, body_fat_percentage,
            bmr_calories, tdee_calories, recorded_date, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
          RETURNING *`
        )
        .bind(
          id, userId, data.weightKg || null, data.muscleMassKg || null,
          data.bodyFatPercentage || null, bmrCalories, tdeeCalories,
          recordedDate, now
        )
        .first<any>();

      if (!result) {
        throw new Error('Database returned empty result when creating profile tracking');
      }

      return this.transformProfileTrackingFromDb(result);
    } catch (error) {
      console.error('Error in createProfileTracking:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create profile tracking: ${error.message}`);
      }
      throw new Error('Failed to create profile tracking: Unknown error occurred');
    }
  }

  async getProfileTrackingHistory(userId: string, query: Partial<ProfileTrackingQueryRequest> = {}): Promise<ProfileTracking[]> {
    try {
      await this.ensureDatabaseInitialized();
      
      let sql = 'SELECT * FROM profile_tracking WHERE user_id = ?1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (query.startDate) {
        sql += ` AND recorded_date >= ?${paramIndex}`;
        params.push(query.startDate);
        paramIndex++;
      }

      if (query.endDate) {
        sql += ` AND recorded_date <= ?${paramIndex}`;
        params.push(query.endDate);
        paramIndex++;
      }

      sql += ' ORDER BY recorded_date DESC, created_at DESC';

      if (query.limit) {
        sql += ` LIMIT ?${paramIndex}`;
        params.push(query.limit);
        paramIndex++;
      }

      if (query.offset) {
        sql += ` OFFSET ?${paramIndex}`;
        params.push(query.offset);
      }

      const result = await this.db.prepare(sql).bind(...params).all<any>();

      if (!result.success) {
        throw new Error(`Database query failed: ${result.error || 'Unknown database error'}`);
      }

      return (result.results || []).map(record => this.transformProfileTrackingFromDb(record));
    } catch (error) {
      console.error('Error in getProfileTrackingHistory:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch profile tracking history: ${error.message}`);
      }
      throw new Error('Failed to fetch profile tracking history: Unknown error occurred');
    }
  }

  // Favorite Foods operations
  async createFavoriteFood(userId: string, data: CreateFavoriteFoodRequest): Promise<FavoriteFood> {
    try {
      await this.ensureDatabaseInitialized();
      
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const result = await this.db
        .prepare(
          `INSERT INTO favorite_foods (
            id, user_id, name, calories, protein_g, carbs_g, fat_g,
            serving_size, category, usage_count, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
          RETURNING *`
        )
        .bind(
          id, userId, data.name, data.calories, data.proteinG || 0,
          data.carbsG || 0, data.fatG || 0, data.servingSize || null,
          data.category || null, 0, now, now
        )
        .first<any>();

      if (!result) {
        throw new Error('Database returned empty result when creating favorite food');
      }

      return this.transformFavoriteFoodFromDb(result);
    } catch (error) {
      console.error('Error in createFavoriteFood:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create favorite food: ${error.message}`);
      }
      throw new Error('Failed to create favorite food: Unknown error occurred');
    }
  }

  async getFavoriteFoods(userId: string, query: Partial<FavoriteFoodQueryRequest> = {}): Promise<FavoriteFood[]> {
    try {
      await this.ensureDatabaseInitialized();
      
      let sql = 'SELECT * FROM favorite_foods WHERE user_id = ?1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (query.category) {
        sql += ` AND category = ?${paramIndex}`;
        params.push(query.category);
        paramIndex++;
      }

      sql += ' ORDER BY usage_count DESC, last_used_at DESC, name ASC';

      if (query.limit) {
        sql += ` LIMIT ?${paramIndex}`;
        params.push(query.limit);
        paramIndex++;
      }

      if (query.offset) {
        sql += ` OFFSET ?${paramIndex}`;
        params.push(query.offset);
      }

      const result = await this.db.prepare(sql).bind(...params).all<any>();

      if (!result.success) {
        throw new Error(`Database query failed: ${result.error || 'Unknown database error'}`);
      }

      return (result.results || []).map(food => this.transformFavoriteFoodFromDb(food));
    } catch (error) {
      console.error('Error in getFavoriteFoods:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch favorite foods: ${error.message}`);
      }
      throw new Error('Failed to fetch favorite foods: Unknown error occurred');
    }
  }

  async getFavoriteFoodById(id: string, userId: string): Promise<FavoriteFood | null> {
    try {
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('SELECT * FROM favorite_foods WHERE id = ?1 AND user_id = ?2')
        .bind(id, userId)
        .first<any>();

      return result ? this.transformFavoriteFoodFromDb(result) : null;
    } catch (error) {
      console.error('Error in getFavoriteFoodById:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch favorite food: ${error.message}`);
      }
      throw new Error('Failed to fetch favorite food: Unknown error occurred');
    }
  }

  async updateFavoriteFood(id: string, userId: string, data: UpdateFavoriteFoodRequest): Promise<FavoriteFood | null> {
    try {
      await this.ensureDatabaseInitialized();
      
      const existingFood = await this.getFavoriteFoodById(id, userId);
      if (!existingFood) {
        return null;
      }

      const now = new Date().toISOString();

      const result = await this.db
        .prepare(
          `UPDATE favorite_foods 
           SET name = COALESCE(?3, name),
               calories = COALESCE(?4, calories),
               protein_g = COALESCE(?5, protein_g),
               carbs_g = COALESCE(?6, carbs_g),
               fat_g = COALESCE(?7, fat_g),
               serving_size = COALESCE(?8, serving_size),
               category = COALESCE(?9, category),
               updated_at = ?10
           WHERE id = ?1 AND user_id = ?2
           RETURNING *`
        )
        .bind(
          id, userId, data.name || null, data.calories || null,
          data.proteinG !== undefined ? data.proteinG : null,
          data.carbsG !== undefined ? data.carbsG : null,
          data.fatG !== undefined ? data.fatG : null,
          data.servingSize !== undefined ? data.servingSize : null,
          data.category !== undefined ? data.category : null,
          now
        )
        .first<any>();

      return result ? this.transformFavoriteFoodFromDb(result) : null;
    } catch (error) {
      console.error('Error in updateFavoriteFood:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update favorite food: ${error.message}`);
      }
      throw new Error('Failed to update favorite food: Unknown error occurred');
    }
  }

  async deleteFavoriteFood(id: string, userId: string): Promise<boolean> {
    try {
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('DELETE FROM favorite_foods WHERE id = ?1 AND user_id = ?2')
        .bind(id, userId)
        .run();

      if (!result.success) {
        throw new Error(`Database delete failed: ${result.error || 'Unknown database error'}`);
      }

      return result.meta.changes > 0;
    } catch (error) {
      console.error('Error in deleteFavoriteFood:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete favorite food: ${error.message}`);
      }
      throw new Error('Failed to delete favorite food: Unknown error occurred');
    }
  }

  async addFavoriteFoodToLog(favoriteFoodId: string, userId: string, mealType: string): Promise<FoodEntry> {
    try {
      await this.ensureDatabaseInitialized();
      
      const favoriteFood = await this.getFavoriteFoodById(favoriteFoodId, userId);
      if (!favoriteFood) {
        throw new Error('Favorite food not found');
      }

      // Create food entry from favorite food
      const foodEntry = await this.createFoodEntry(userId, {
        foodName: favoriteFood.name,
        calories: favoriteFood.calories,
        proteinG: favoriteFood.proteinG,
        carbsG: favoriteFood.carbsG,
        fatG: favoriteFood.fatG,
        mealType: mealType as any,
        source: 'manual',
      });

      // Update favorite food usage stats
      const now = new Date().toISOString();
      await this.db
        .prepare(
          `UPDATE favorite_foods 
           SET usage_count = usage_count + 1, last_used_at = ?3, updated_at = ?3
           WHERE id = ?1 AND user_id = ?2`
        )
        .bind(favoriteFoodId, userId, now)
        .run();

      return foodEntry;
    } catch (error) {
      console.error('Error in addFavoriteFoodToLog:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to add favorite food to log: ${error.message}`);
      }
      throw new Error('Failed to add favorite food to log: Unknown error occurred');
    }
  }

  // ===== MCP API Key Management =====

  // NOTE: These crypto functions are duplicated from apps/api/src/utils/crypto.ts
  // This is a temporary solution due to the current project structure.
  // Ideally, these should be in a shared crypto package.
  private generateApiKey(): string {
    const array = new Uint8Array(24); // 24 bytes -> 48 hex chars
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private transformMCPApiKeyFromDb(rawKey: any): MCPApiKey {
    return {
      id: rawKey.id,
      userId: rawKey.user_id,
      keyPrefix: rawKey.key_prefix,
      name: rawKey.name,
      lastUsedAt: rawKey.last_used_at,
      createdAt: rawKey.created_at,
      revokedAt: rawKey.revoked_at,
    };
  }

  async createMCPApiKey(userId: string, data: MCPApiKeyCreateData): Promise<NewMCPApiKey> {
    await this.ensureDatabaseInitialized();
    const apiKey = `sb_live_${this.generateApiKey()}`;
    const keyHash = await this.hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 8); // e.g., "sb_live_"
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(
        `INSERT INTO mcp_api_keys (id, user_id, key_hash, key_prefix, name, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         RETURNING *`
      )
      .bind(id, userId, keyHash, keyPrefix, data.name || null, now)
      .first<any>();

    if (!result) {
      throw new Error('Database returned empty result when creating MCP API key');
    }

    const newKey = this.transformMCPApiKeyFromDb(result);
    return { ...newKey, apiKey };
  }

  async getMCPApiKeys(userId: string): Promise<MCPApiKey[]> {
    await this.ensureDatabaseInitialized();
    const result = await this.db
      .prepare('SELECT * FROM mcp_api_keys WHERE user_id = ?1 AND revoked_at IS NULL ORDER BY created_at DESC')
      .bind(userId)
      .all<any>();

    if (!result.success) {
      throw new Error(`Database query failed: ${result.error || 'Unknown database error'}`);
    }

    return (result.results || []).map(key => this.transformMCPApiKeyFromDb(key));
  }

  async updateMCPApiKeyName(keyId: string, userId: string, data: MCPApiKeyUpdateData): Promise<MCPApiKey | null> {
    await this.ensureDatabaseInitialized();
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(
        `UPDATE mcp_api_keys
         SET name = ?3, updated_at = ?4
         WHERE id = ?1 AND user_id = ?2 AND revoked_at IS NULL
         RETURNING *`
      )
      .bind(keyId, userId, data.name, now)
      .first<any>();

    return result ? this.transformMCPApiKeyFromDb(result) : null;
  }

  async revokeMCPApiKey(keyId: string, userId: string): Promise<boolean> {
    await this.ensureDatabaseInitialized();
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(
        `UPDATE mcp_api_keys
         SET revoked_at = ?3
         WHERE id = ?1 AND user_id = ?2 AND revoked_at IS NULL`
      )
      .bind(keyId, userId, now)
      .run();

    if (!result.success) {
      throw new Error(`Database delete failed: ${result.error || 'Unknown database error'}`);
    }

    return result.meta.changes > 0;
  }
}