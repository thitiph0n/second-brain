// Comprehensive Meal Tracker Service for business logic, calculations, and database operations

import { drizzle } from 'drizzle-orm/d1';
import {
  eq,
  and,
  or,
  gte,
  lt,
  lte,
  desc,
  asc,
  sql,
  between,
  ilike
} from 'drizzle-orm';
import {
  userProfiles,
  meals,
  mealStreaks,
  dailySummaries,
  favoriteFoods,
  foods
} from '@second-brain/database/schema';
import type {
  ProfileFormData,
  MealFormData,
  MacroTargets,
  Gender,
  ActivityLevel,
  Goal,
  MealType
} from '@second-brain/types/meal-tracker';

export class MealTrackerService {
  private db: ReturnType<typeof drizzle>;

  constructor(d1Database: D1Database) {
    this.db = drizzle(d1Database);
  }

  // TDEE Calculation Constants and Methods
  private activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };

  private goalAdjustments: Record<Goal, number> = {
    lose_weight: -500,
    maintain_weight: 0,
    gain_weight: 500
  };

  /**
   * Calculate TDEE using Mifflin-St Jeor equation
   * BMR = 10 * weight + 6.25 * height - 5 * age + s (s=+5 for male, -161 for female)
   */
  private calculateTDEE(weightKg: number, heightCm: number, age: number, gender: Gender, activityLevel: ActivityLevel, goal: Goal): number {
    const genderFactor = gender === 'male' ? 5 : -161;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderFactor;
    const activityMultiplier = this.activityMultipliers[activityLevel];
    const goalAdjustment = this.goalAdjustments[goal];

    return Math.round((bmr * activityMultiplier) + goalAdjustment);
  }

  /**
   * Calculate macro targets based on user profile
   * Protein: 2g per kg body weight
   * Fat: 25-35% of total calories
   * Carbs: Remainder of calories
   */
  private calculateMacroTargets(weightKg: number, targetCalories: number, gender: Gender): MacroTargets {
    const proteinG = Math.round(weightKg * 2);
    const proteinCalories = proteinG * 4;
    const fatCaloriesRatio = gender === 'male' ? 0.3 : 0.35; // 30% for men, 35% for women
    const fatCalories = Math.round(targetCalories * fatCaloriesRatio);
    const fatG = Math.round(fatCalories / 9);
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    const carbsG = Math.round(remainingCalories / 4);

    return {
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG
    };
  }

  // User Profile & TDEE Service

  /**
   * Create or update user profile with TDEE and macro calculations
   */
  async createOrUpdateUserProfile(userId: string, profileData: Partial<ProfileFormData>): Promise<typeof userProfiles.$inferSelect> {
    try {
      const now = new Date().toISOString();

      // Check if profile exists for the user
      const existingProfile = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .get();

      // Merge with existing profile data if updating
      const mergedData: ProfileFormData = existingProfile ? {
        age: profileData.age ?? existingProfile.age,
        weightKg: profileData.weightKg ?? existingProfile.weightKg,
        heightCm: profileData.heightCm ?? existingProfile.heightCm,
        gender: profileData.gender ?? existingProfile.gender,
        activityLevel: profileData.activityLevel ?? existingProfile.activityLevel,
        goal: profileData.goal ?? existingProfile.goal,
      } : profileData as ProfileFormData;

      // Validate that all required fields are present
      if (!mergedData.age || !mergedData.weightKg || !mergedData.heightCm || !mergedData.gender || !mergedData.activityLevel || !mergedData.goal) {
        throw new Error('Missing required profile fields');
      }

      // Calculate TDEE and macro targets
      const tdee = this.calculateTDEE(
        mergedData.weightKg,
        mergedData.heightCm,
        mergedData.age,
        mergedData.gender,
        mergedData.activityLevel,
        mergedData.goal
      );

      const macroTargets = this.calculateMacroTargets(
        mergedData.weightKg,
        tdee,
        mergedData.gender
      );

      const profileDataWithTargets = {
        ...mergedData,
        tdee,
        targetCalories: tdee,
        targetProteinG: macroTargets.protein_g,
        targetCarbsG: macroTargets.carbs_g,
        targetFatG: macroTargets.fat_g
      };

      if (existingProfile) {
        // Update existing profile
        return await this.db
          .update(userProfiles)
          .set({
            ...profileDataWithTargets,
            updatedAt: now
          })
          .where(eq(userProfiles.id, existingProfile.id))
          .returning()
          .get();
      } else {
        // Create new profile
        const id = crypto.randomUUID();
        return await this.db
          .insert(userProfiles)
          .values({
            id,
            userId,
            ...profileDataWithTargets,
            createdAt: now,
            updatedAt: now
          })
          .returning()
          .get();
      }
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create/update user profile: ${errorMessage}`);
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<(typeof userProfiles.$inferSelect) | null> {
    try {
      const result = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .get();

      return result || null;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch user profile: ${errorMessage}`);
    }
  }

  /**
   * Check if user has existing profile
   */
  async hasUserProfile(userId: string): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1)
        .get();

      return !!result;
    } catch (error) {
      console.error('Error in hasUserProfile:', error);
      throw new Error(`Failed to check user profile existence: ${error.message}`);
    }
  }

  // Meal Management Service

  /**
   * Create a new meal entry
   */
  async createMeal(userId: string, mealData: MealFormData): Promise<typeof meals.$inferSelect> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const loggedAt = mealData.loggedAt ? new Date(mealData.loggedAt).toISOString() : now;

      const result = await this.db
        .insert(meals)
        .values({
          id,
          userId,
          mealType: mealData.mealType,
          foodName: mealData.foodName,
          calories: mealData.calories,
          proteinG: mealData.proteinG || 0,
          carbsG: mealData.carbsG || 0,
          fatG: mealData.fatG || 0,
          servingSize: mealData.servingSize || null,
          servingUnit: mealData.servingUnit || null,
          imageUrl: mealData.imageUrl || null,
          notes: mealData.notes || null,
          loggedAt,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get();

      await this.updateDailySummary(userId, loggedAt.split('T')[0], result);
      await this.updateStreak(userId, loggedAt.split('T')[0]);

      return result;
    } catch (error) {
      console.error('Error in createMeal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create meal: ${errorMessage}`);
    }
  }

  /**
   * Get meal by ID
   */
  async getMealById(id: string, userId: string): Promise<(typeof meals.$inferSelect) | null> {
    try {
      const result = await this.db
        .select()
        .from(meals)
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .get();

      return result || null;
    } catch (error) {
      console.error('Error in getMealById:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch meal: ${error.message}`);
      }
      throw new Error('Failed to fetch meal: Unknown error occurred');
    }
  }

  /**
   * Get meals by user with pagination and filtering
   */
  async getMealsByUser(userId: string, options?: {
    mealType?: MealType;
    date?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'loggedAt' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ meals: (typeof meals.$inferSelect)[]; total: number }> {
    try {
      const {
        mealType,
        date,
        limit = 50,
        offset = 0,
        sortBy = 'loggedAt',
        sortOrder = 'desc'
      } = options || {};

      // Build where conditions
      const conditions = [eq(meals.userId, userId)];

      if (mealType) {
        conditions.push(eq(meals.mealType, mealType));
      }

      if (date) {
        // Filter by date portion of loggedAt, ignoring time
        // This handles timezone differences by comparing just the date part
        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;
        conditions.push(between(meals.loggedAt, startOfDay, endOfDay));
      }

      // Get total count
      const allResults = await this.db
        .select()
        .from(meals)
        .where(and(...conditions))
        .all();
      const total = allResults.length;

      // Apply sorting and pagination
      const orderByField = sortBy === 'loggedAt' ? meals.loggedAt : meals.createdAt;
      const order = sortOrder === 'desc' ? desc(orderByField) : asc(orderByField);

      const result = await this.db
        .select()
        .from(meals)
        .where(and(...conditions))
        .orderBy(order)
        .limit(limit)
        .offset(offset)
        .all();

      return {
        meals: result,
        total
      };
    } catch (error) {
      console.error('Error in getMealsByUser:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch meals: ${error.message}`);
      }
      throw new Error('Failed to fetch meals: Unknown error occurred');
    }
  }

  /**
   * Update meal by ID
   */
  async updateMeal(id: string, userId: string, mealData: Partial<MealFormData>): Promise<(typeof meals.$inferSelect) | null> {
    try {
      const existingMeal = await this.getMealById(id, userId);
      if (!existingMeal) {
        return null;
      }

      const now = new Date().toISOString();
      const loggedAt = mealData.loggedAt ? new Date(mealData.loggedAt).toISOString() : existingMeal.loggedAt;

      const updateData: Partial<typeof meals.$inferInsert> = {
        updatedAt: now
      };

      if (mealData.mealType !== undefined) updateData.mealType = mealData.mealType;
      if (mealData.foodName !== undefined) updateData.foodName = mealData.foodName;
      if (mealData.calories !== undefined) updateData.calories = mealData.calories;
      if (mealData.proteinG !== undefined) updateData.proteinG = mealData.proteinG;
      if (mealData.carbsG !== undefined) updateData.carbsG = mealData.carbsG;
      if (mealData.fatG !== undefined) updateData.fatG = mealData.fatG;
      if (mealData.servingSize !== undefined) updateData.servingSize = mealData.servingSize;
      if (mealData.servingUnit !== undefined) updateData.servingUnit = mealData.servingUnit;
      if (mealData.imageUrl !== undefined) updateData.imageUrl = mealData.imageUrl;
      if (mealData.notes !== undefined) updateData.notes = mealData.notes;
      if (mealData.loggedAt !== undefined) updateData.loggedAt = loggedAt;

      const result = await this.db
        .update(meals)
        .set(updateData)
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .returning()
        .get();

      // Update daily summary if date changed
      if (mealData.loggedAt && mealData.loggedAt !== existingMeal.loggedAt) {
        const oldDate = existingMeal.loggedAt.split('T')[0];
        const newDate = loggedAt.split('T')[0];
        if (oldDate !== newDate) {
          await this.updateDailySummary(userId, oldDate, existingMeal, true);
          await this.updateDailySummary(userId, newDate, result);
        }
      }

      return result;
    } catch (error) {
      console.error('Error in updateMeal:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update meal: ${error.message}`);
      }
      throw new Error('Failed to update meal: Unknown error occurred');
    }
  }

  /**
   * Delete meal by ID
   */
  async deleteMeal(id: string, userId: string): Promise<boolean> {
    try {
      const existingMeal = await this.getMealById(id, userId);
      if (!existingMeal) {
        return false;
      }

      await this.db
        .delete(meals)
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .run();

      // Update daily summary
      await this.updateDailySummary(userId, existingMeal.loggedAt.split('T')[0], existingMeal, true);

      return true;
    } catch (error) {
      console.error('Error in deleteMeal:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete meal: ${error.message}`);
      }
      throw new Error('Failed to delete meal: Unknown error occurred');
    }
  }

  /**
   * Get daily summary for a specific date
   */
  async getDailySummary(userId: string, date: string): Promise<any> {
    try {
      // Get all meals for the date
      const startOfDay = new Date(`${date}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(`${date}T23:59:59.999Z`).toISOString();

      const mealsForDay = await this.db
        .select()
        .from(meals)
        .where(
          and(
            eq(meals.userId, userId),
            between(meals.loggedAt, startOfDay, endOfDay)
          )
        )
        .all();

      // If no meals, return null
      if (mealsForDay.length === 0) {
        return null;
      }

      // Calculate aggregated summary
      const summary = {
        date,
        totalCalories: mealsForDay.reduce((sum, meal) => sum + (meal.calories || 0), 0),
        totalProteinG: mealsForDay.reduce((sum, meal) => sum + (meal.proteinG || 0), 0),
        totalCarbsG: mealsForDay.reduce((sum, meal) => sum + (meal.carbsG || 0), 0),
        totalFatG: mealsForDay.reduce((sum, meal) => sum + (meal.fatG || 0), 0),
        mealCount: mealsForDay.length,
      };

      return summary;
    } catch (error) {
      console.error('Error in getDailySummary:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch daily summary: ${error.message}`);
      }
      throw new Error('Failed to fetch daily summary: Unknown error occurred');
    }
  }

  /**
   * Get daily summaries for a date range
   */
  async getDailySummariesByDateRange(userId: string, startDate: string, endDate: string): Promise<(typeof dailySummaries.$inferSelect)[]> {
    try {
      return await this.db
        .select()
        .from(dailySummaries)
        .where(
          and(
            eq(dailySummaries.userId, userId),
            gte(dailySummaries.date, startDate),
            lte(dailySummaries.date, endDate)
          )
        )
        .orderBy(asc(dailySummaries.date))
        .all();
    } catch (error) {
      console.error('Error in getDailySummariesByDateRange:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch daily summaries: ${error.message}`);
      }
      throw new Error('Failed to fetch daily summaries: Unknown error occurred');
    }
  }

  /**
   * Update daily summary after meal creation/update/deletion
   */
  private async updateDailySummary(userId: string, date: string, meal: typeof meals.$inferSelect, isDelete = false): Promise<void> {
    try {
      const existingSummary = await this.db
        .select()
        .from(dailySummaries)
        .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date)))
        .get();

      const mealData = isDelete ? {
        calories: -meal.calories,
        proteinG: -meal.proteinG,
        carbsG: -meal.carbsG,
        fatG: -meal.fatG
      } : {
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG
      };

      if (existingSummary) {
        // Update existing summary
        await this.db
          .update(dailySummaries)
          .set({
            totalCalories: existingSummary.totalCalories + mealData.calories,
            totalProteinG: existingSummary.totalProteinG + mealData.proteinG,
            totalCarbsG: existingSummary.totalCarbsG + mealData.carbsG,
            totalFatG: existingSummary.totalFatG + mealData.fatG,
            mealCount: isDelete ? (existingSummary.mealCount || 0) - 1 : (existingSummary.mealCount || 0) + 1,
            updatedAt: new Date().toISOString()
          })
          .where(eq(dailySummaries.id, existingSummary.id))
          .run();

        // Delete if meal count goes to zero
        if (((existingSummary.mealCount || 0) + (isDelete ? -1 : 1)) <= 0) {
          await this.db
            .delete(dailySummaries)
            .where(eq(dailySummaries.id, existingSummary.id))
            .run();
        }
      } else if (!isDelete) {
        // Create new summary if it doesn't exist and it's not a delete operation
        const userProfile = await this.getUserProfile(userId);
        const targetCalories = userProfile?.target_calories || 0;

        await this.db
          .insert(dailySummaries)
          .values({
            id: crypto.randomUUID(),
            userId,
            date,
            totalCalories: mealData.calories,
            totalProteinG: mealData.proteinG,
            totalCarbsG: mealData.carbsG,
            totalFatG: mealData.fatG,
            mealCount: 1,
            targetCalories,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .run();
      }
    } catch (error) {
      console.error('Error in updateDailySummary:', error);
      throw new Error(`Failed to update daily summary: ${error.message}`);
    }
  }

  // Streak Calculation Service

  /**
   * Get streak information for user
   */
  async getStreak(userId: string): Promise<(typeof mealStreaks.$inferSelect) | null> {
    try {
      const result = await this.db
        .select()
        .from(mealStreaks)
        .where(eq(mealStreaks.userId, userId))
        .get();

      return result || null;
    } catch (error) {
      console.error('Error in getStreak:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch streak: ${error.message}`);
      }
      throw new Error('Failed to fetch streak: Unknown error occurred');
    }
  }

  /**
   * Initialize streak record for user
   */
  async initializeStreak(userId: string): Promise<typeof mealStreaks.$inferSelect> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      return await this.db
        .insert(mealStreaks)
        .values({
          id,
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastLoggedDate: null,
          freezeCredits: 2,
          totalLoggedDays: 0,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get();
    } catch (error) {
      console.error('Error in initializeStreak:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to initialize streak: ${error.message}`);
      }
      throw new Error('Failed to initialize streak: Unknown error occurred');
    }
  }

  /**
   * Update streak after meal logging
   */
  private async updateStreak(userId: string, date: string): Promise<void> {
    try {
      let streak = await this.getStreak(userId);
      if (!streak) {
        streak = await this.initializeStreak(userId);
      }

      const today = new Date().toISOString().split('T')[0];
      const lastLoggedDate = streak.lastLoggedDate ? new Date(streak.lastLoggedDate).toISOString().split('T')[0] : null;

      let newStreak = streak.currentStreak;
      let newLongestStreak = streak.longestStreak;
      let newTotalLoggedDays = streak.totalLoggedDays;
      const newLastLoggedDate = new Date(date).toISOString();

      if (lastLoggedDate && lastLoggedDate !== date) {
        const lastDate = new Date(lastLoggedDate);
        const currentDate = new Date(date);
        const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          // Consecutive day
          newStreak += 1;
          newTotalLoggedDays += 1;
        } else if (dayDiff > 1) {
          // Gap in streak
          if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
          }
          newStreak = 1;
          newTotalLoggedDays += 1;
        }
      } else if (!lastLoggedDate || lastLoggedDate === date) {
        // First time logging or same day (shouldn't happen)
        newStreak = 1;
        newTotalLoggedDays = 1;
      }

      // Update longest streak if needed
      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak;
      }

      await this.db
        .update(mealStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastLoggedDate: newLastLoggedDate,
          totalLoggedDays: newTotalLoggedDays,
          updatedAt: new Date().toISOString()
        })
        .where(eq(mealStreaks.userId, userId))
        .run();
    } catch (error) {
      console.error('Error in updateStreak:', error);
      throw new Error(`Failed to update streak: ${error.message}`);
    }
  }

  /**
   * Use a freeze credit to skip a day
   */
  async useFreezeCredit(userId: string): Promise<boolean> {
    try {
      const streak = await this.getStreak(userId);
      if (!streak || streak.freeze_credits <= 0) {
        return false;
      }

      await this.db
        .update(mealStreaks)
        .set({
          freezeCredits: streak.freeze_credits - 1,
          updatedAt: new Date().toISOString()
        })
        .where(eq(mealStreaks.userId, userId))
        .run();

      return true;
    } catch (error) {
      console.error('Error in useFreezeCredit:', error);
      throw new Error(`Failed to use freeze credit: ${error.message}`);
    }
  }

  /**
   * Reset current streak (but keep longest streak)
   */
  async resetCurrentStreak(userId: string): Promise<void> {
    try {
      const streak = await this.getStreak(userId);
      if (!streak) return;

      await this.db
        .update(mealStreaks)
        .set({
          currentStreak: 0,
          lastLoggedDate: null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(mealStreaks.userId, userId))
        .run();
    } catch (error) {
      console.error('Error in resetCurrentStreak:', error);
      throw new Error(`Failed to reset current streak: ${error.message}`);
    }
  }

  /**
   * Get calendar data for streak visualization
   */
  async getStreakCalendar(userId: string, year: number, month: number): Promise<{
    hasLoggedDays: string[];
    streakInfo: { current: number; longest: number; freezeCredits: number };
  }> {
    try {
      const streak = await this.getStreak(userId);
      if (!streak) {
        return { hasLoggedDays: [], streakInfo: { current: 0, longest: 0, freezeCredits: 0 } };
      }

      // Get all meals for the specified month
      const startOfMonth = new Date(year, month - 1, 1).toISOString();
      const endOfMonth = new Date(year, month, 0).toISOString();

      const meals = await this.db
        .select({ loggedAt: meals.loggedAt })
        .from(meals)
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.loggedAt, startOfMonth),
            lte(meals.loggedAt, endOfMonth)
          )
        )
        .all();

      // Extract unique dates from logged meals
      const loggedDates = meals
        .map(meal => new Date(meal.loggedAt).toISOString().split('T')[0])
        .filter((date, index, arr) => arr.indexOf(date) === index);

      const streakInfo = {
        current: streak.current_streak,
        longest: streak.longest_streak,
        freezeCredits: streak.freeze_credits
      };

      return {
        hasLoggedDays: loggedDates,
        streakInfo
      };
    } catch (error) {
      console.error('Error in getStreakCalendar:', error);
      throw new Error(`Failed to fetch streak calendar: ${error.message}`);
    }
  }

  // Favorite Foods Service

  /**
   * Create a new favorite food
   */
  async createFavoriteFood(userId: string, foodData: {
    foodName: string;
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    servingSize?: string;
    servingUnit?: string;
    category?: string;
  }): Promise<typeof favoriteFoods.$inferSelect> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      return await this.db
        .insert(favoriteFoods)
        .values({
          id,
          userId,
          foodName: foodData.foodName,
          calories: foodData.calories,
          proteinG: foodData.proteinG || 0,
          carbsG: foodData.carbsG || 0,
          fatG: foodData.fatG || 0,
          servingSize: foodData.servingSize || null,
          servingUnit: foodData.servingUnit || null,
          category: foodData.category || null,
          usageCount: 0,
          lastUsedAt: null,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get();
    } catch (error) {
      console.error('Error in createFavoriteFood:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create favorite food: ${error.message}`);
      }
      throw new Error('Failed to create favorite food: Unknown error occurred');
    }
  }

  /**
   * Get favorite foods by user, sorted by usage count
   */
  async getFavoriteFoodsByUser(userId: string, limit = 20): Promise<(typeof favoriteFoods.$inferSelect)[]> {
    try {
      return await this.db
        .select()
        .from(favoriteFoods)
        .where(eq(favoriteFoods.userId, userId))
        .orderBy(desc(favoriteFoods.usageCount), desc(favoriteFoods.lastUsedAt), desc(favoriteFoods.createdAt))
        .limit(limit)
        .all();
    } catch (error) {
      console.error('Error in getFavoriteFoodsByUser:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch favorite foods: ${error.message}`);
      }
      throw new Error('Failed to fetch favorite foods: Unknown error occurred');
    }
  }

  /**
   * Get favorite food by ID
   */
  async getFavoriteFoodById(id: string, userId: string): Promise<(typeof favoriteFoods.$inferSelect) | null> {
    try {
      const result = await this.db
        .select()
        .from(favoriteFoods)
        .where(and(eq(favoriteFoods.id, id), eq(favoriteFoods.userId, userId)))
        .get();

      return result || null;
    } catch (error) {
      console.error('Error in getFavoriteFoodById:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch favorite food: ${error.message}`);
      }
      throw new Error('Failed to fetch favorite food: Unknown error occurred');
    }
  }

  /**
   * Increment usage count for a favorite food
   */
  async incrementFavoriteFoodUsage(id: string, userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await this.db
        .update(favoriteFoods)
        .set({
          usageCount: sql`${favoriteFoods.usageCount} + 1`,
          lastUsedAt: now,
          updatedAt: now
        })
        .where(and(eq(favoriteFoods.id, id), eq(favoriteFoods.userId, userId)))
        .run();
    } catch (error) {
      console.error('Error in incrementFavoriteFoodUsage:', error);
      throw new Error(`Failed to increment favorite food usage: ${error.message}`);
    }
  }

  /**
   * Update favorite food
   */
  async updateFavoriteFood(id: string, userId: string, foodData: Partial<{
    foodName: string;
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    servingSize?: string;
    servingUnit?: string;
    category?: string;
  }>): Promise<(typeof favoriteFoods.$inferSelect) | null> {
    try {
      const existingFood = await this.getFavoriteFoodById(id, userId);
      if (!existingFood) {
        return null;
      }

      const now = new Date().toISOString();

      const updateData: Partial<typeof favoriteFoods.$inferInsert> = {
        updatedAt: now
      };

      if (foodData.foodName !== undefined) updateData.foodName = foodData.foodName;
      if (foodData.calories !== undefined) updateData.calories = foodData.calories;
      if (foodData.proteinG !== undefined) updateData.proteinG = foodData.proteinG;
      if (foodData.carbsG !== undefined) updateData.carbsG = foodData.carbsG;
      if (foodData.fatG !== undefined) updateData.fatG = foodData.fatG;
      if (foodData.servingSize !== undefined) updateData.servingSize = foodData.servingSize;
      if (foodData.servingUnit !== undefined) updateData.servingUnit = foodData.servingUnit;
      if (foodData.category !== undefined) updateData.category = foodData.category;

      return await this.db
        .update(favoriteFoods)
        .set(updateData)
        .where(and(eq(favoriteFoods.id, id), eq(favoriteFoods.userId, userId)))
        .returning()
        .get();
    } catch (error) {
      console.error('Error in updateFavoriteFood:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update favorite food: ${error.message}`);
      }
      throw new Error('Failed to update favorite food: Unknown error occurred');
    }
  }

  /**
   * Delete favorite food
   */
  async deleteFavoriteFood(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(favoriteFoods)
        .where(and(eq(favoriteFoods.id, id), eq(favoriteFoods.userId, userId)))
        .run();

      return result.meta.changes > 0;
    } catch (error) {
      console.error('Error in deleteFavoriteFood:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete favorite food: ${error.message}`);
      }
      throw new Error('Failed to delete favorite food: Unknown error occurred');
    }
  }

  /**
   * Search favorite foods by name
   */
  async searchFavoriteFoods(userId: string, query: string, limit = 10): Promise<(typeof favoriteFoods.$inferSelect)[]> {
    try {
      return await this.db
        .select()
        .from(favoriteFoods)
        .where(
          and(
            eq(favoriteFoods.userId, userId),
            ilike(favoriteFoods.foodName, `%${query}%`)
          )
        )
        .orderBy(desc(favoriteFoods.usageCount), desc(favoriteFoods.lastUsedAt), desc(favoriteFoods.createdAt))
        .limit(limit)
        .all();
    } catch (error) {
      console.error('Error in searchFavoriteFoods:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to search favorite foods: ${error.message}`);
      }
      throw new Error('Failed to search favorite foods: Unknown error occurred');
    }
  }

  // Analytics Service

  /**
   * Get nutrition analytics for a date range
   */
  async getNutritionAnalytics(userId: string, startDate: string, endDate: string): Promise<{
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
  }> {
    try {
      const dailyBreakdown = await this.getDailySummariesByDateRange(userId, startDate, endDate);

      const totals = dailyBreakdown.reduce((acc, day) => ({
        calories: acc.calories + day.total_calories,
        protein: acc.protein + day.total_protein_g,
        carbs: acc.carbs + day.total_carbs_g,
        fat: acc.fat + day.total_fat_g
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const avgCalories = dailyBreakdown.length > 0 ? totals.calories / dailyBreakdown.length : 0;

      const profile = await this.getUserProfile(userId);
      const targetCalories = profile?.target_calories || 2000;

      const goalAchievementRate = dailyBreakdown.length > 0
        ? dailyBreakdown.filter(day => Math.abs(day.total_calories - targetCalories) <= 200).length / dailyBreakdown.length * 100
        : 0;

      const totalCaloriesForRatio = totals.calories || 1;
      const avgProteinRatio = (totals.protein * 4 / totalCaloriesForRatio) * 100;
      const avgCarbsRatio = (totals.carbs * 4 / totalCaloriesForRatio) * 100;
      const avgFatRatio = (totals.fat * 9 / totalCaloriesForRatio) * 100;

      return {
        dailyBreakdown,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        averageCalories: avgCalories,
        goalAchievementRate,
        averageProteinRatio: avgProteinRatio,
        averageCarbsRatio: avgCarbsRatio,
        averageFatRatio: avgFatRatio
      };
    } catch (error) {
      console.error('Error in getNutritionAnalytics:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch nutrition analytics: ${error.message}`);
      }
      throw new Error('Failed to fetch nutrition analytics: Unknown error occurred');
    }
  }

  /**
   * Get macro distribution analysis
   */
  async getMacroDistribution(userId: string, days: number = 7): Promise<{
    idealDistribution: { protein: number; carbs: number; fat: number };
    actualDistribution: { protein: number; carbs: number; fat: number };
    deviation: { protein: number; carbs: number; fat: number };
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      const startDateStr = startDate.toISOString().split('T')[0];

      const analytics = await this.getNutritionAnalytics(userId, startDateStr, endDate);
      const profile = await this.getUserProfile(userId);

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Calculate ideal macro distribution based on profile
      const idealProteinCalories = profile.target_protein_g * 4;
      const idealFatCalories = profile.target_fat_g * 9;
      const idealCarbsCalories = profile.target_calories - idealProteinCalories - idealFatCalories;

      const totalCalories = idealProteinCalories + idealFatCalories + idealCarbsCalories || 1;

      return {
        idealDistribution: {
          protein: (idealProteinCalories / totalCalories) * 100,
          carbs: (idealCarbsCalories / totalCalories) * 100,
          fat: (idealFatCalories / totalCalories) * 100
        },
        actualDistribution: {
          protein: analytics.averageProteinRatio,
          carbs: analytics.averageCarbsRatio,
          fat: analytics.averageFatRatio
        },
        deviation: {
          protein: analytics.averageProteinRatio - (idealProteinCalories / totalCalories) * 100,
          carbs: analytics.averageCarbsRatio - (idealCarbsCalories / totalCalories) * 100,
          fat: analytics.averageFatRatio - (idealFatCalories / totalCalories) * 100
        }
      };
    } catch (error) {
      console.error('Error in getMacroDistribution:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch macro distribution: ${error.message}`);
      }
      throw new Error('Failed to fetch macro distribution: Unknown error occurred');
    }
  }

  /**
   * Get weekly summaries for trend analysis
   */
  async getWeeklySummaries(userId: string, weeks: number = 4): Promise<{
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
      consistencyScore: number; // 0-100
    };
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (weeks * 7));

      const weekSummaries = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const weekAnalytics = await this.getNutritionAnalytics(userId, weekStartStr, weekEndStr);

        weekSummaries.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          totalCalories: weekAnalytics.totalCalories,
          averageDailyCalories: weekAnalytics.averageCalories,
          totalProtein: weekAnalytics.totalProtein,
          totalCarbs: weekAnalytics.totalCarbs,
          totalFat: weekAnalytics.totalFat,
          mealCount: weekAnalytics.dailyBreakdown.reduce((sum, day) => sum + day.meal_count, 0)
        });
      }

      // Calculate trends
      const calorieTrends = weekSummaries.map(w => w.averageDailyCalories);
      const proteinTrends = weekSummaries.map(w => w.totalProtein);

      const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
        if (values.length < 2) return 'stable';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const threshold = 0.1; // 10% threshold for significant change

        if ((secondAvg - firstAvg) / firstAvg > threshold) return 'increasing';
        if ((firstAvg - secondAvg) / firstAvg > threshold) return 'decreasing';
        return 'stable';
      };

      // Calculate consistency score (0-100)
      const dailyCalories = weekSummaries.flatMap(w =>
        Array(7).fill(0).map((_, i) => {
          const date = new Date(w.weekStart);
          date.setDate(date.getDate() + i);
          const summary = weekSummaries.find(ws =>
            date >= new Date(ws.weekStart) && date <= new Date(ws.weekEnd)
          );
          return summary ? summary.averageDailyCalories : 0;
        })
      ).filter(cal => cal > 0);

      const avgCalories = dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length;
      const variance = dailyCalories.reduce((acc, cal) => acc + Math.pow(cal - avgCalories, 2), 0) / dailyCalories.length;
      const standardDeviation = Math.sqrt(variance);

      // Consistency is inversely related to standard deviation (lower = more consistent)
      const consistencyScore = Math.max(0, 100 - (standardDeviation / avgCalories) * 100);

      return {
        weekSummaries,
        trends: {
          calorieTrend: calculateTrend(calorieTrends),
          proteinTrend: calculateTrend(proteinTrends),
          consistencyScore: Math.round(consistencyScore)
        }
      };
    } catch (error) {
      console.error('Error in getWeeklySummaries:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch weekly summaries: ${error.message}`);
      }
      throw new Error('Failed to fetch weekly summaries: Unknown error occurred');
    }
  }

  // Food Search Service (for future food database integration)

  /**
   * Search foods from food database (placeholder for future AI integration)
   */
  async searchFoods(query: string, limit: number = 10): Promise<Array<{
    id: string;
    name: string;
    brand: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    category: string;
  }>> {
    try {
      // This is a placeholder for future food database integration
      // Currently returns empty array, but designed to be extended with AI-powered food search
      const result = await this.db
        .select()
        .from(foods)
        .where(ilike(foods.name, `%${query}%`))
        .limit(limit)
        .all();

      return result.map(food => ({
        id: food.id,
        name: food.name,
        brand: food.brand || '',
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        category: food.category || ''
      }));
    } catch (error) {
      console.error('Error in searchFoods:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to search foods: ${error.message}`);
      }
      throw new Error('Failed to search foods: Unknown error occurred');
    }
  }

  /**
   * Add food to food database (placeholder for future AI integration)
   */
  async addFoodToDatabase(foodData: {
    name: string;
    brand?: string;
    caloriesPer100g: number;
    proteinPer100g?: number;
    carbsPer100g?: number;
    fatPer100g?: number;
    servingSizeG?: number;
    servingDescription?: string;
    category?: string;
  }): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const result = await this.db
        .insert(foods)
        .values({
          id,
          name: foodData.name,
          brand: foodData.brand || null,
          caloriesPer100g: foodData.caloriesPer100g,
          proteinPer100g: foodData.proteinPer100g || 0,
          carbsPer100g: foodData.carbsPer100g || 0,
          fatPer100g: foodData.fatPer100g || 0,
          servingSizeG: foodData.servingSizeG || null,
          servingDescription: foodData.servingDescription || null,
          category: foodData.category || null,
          createdAt: now
        })
        .returning({ id: foods.id })
        .get();

      return result.id;
    } catch (error) {
      console.error('Error in addFoodToDatabase:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to add food to database: ${error.message}`);
      }
      throw new Error('Failed to add food to database: Unknown error occurred');
    }
  }

}