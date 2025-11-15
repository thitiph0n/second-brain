import { sqliteTable, text, real, integer, check } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

// User profiles with TDEE calculation
export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  age: integer('age').notNull(),
  weightKg: real('weight_kg').notNull(),
  heightCm: real('height_cm').notNull(),
  gender: text('gender').notNull(),
  activityLevel: text('activity_level').notNull(),
  goal: text('goal').notNull(),
  tdee: real('tdee').notNull(),
  targetCalories: real('target_calories').notNull(),
  targetProteinG: real('target_protein_g').notNull(),
  targetCarbsG: real('target_carbs_g').notNull(),
  targetFatG: real('target_fat_g').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

// Meals table
export const meals = sqliteTable('meals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mealType: text('meal_type').notNull(),
  foodName: text('food_name').notNull(),
  calories: real('calories').notNull(),
  proteinG: real('protein_g').default(0),
  carbsG: real('carbs_g').default(0),
  fatG: real('fat_g').default(0),
  servingSize: text('serving_size'),
  servingUnit: text('serving_unit'),
  imageUrl: text('image_url'),
  notes: text('notes'),
  loggedAt: text('logged_at').default(new Date().toISOString()),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
}));

// Streaks table
export const mealStreaks = sqliteTable('meal_streaks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastLoggedDate: text('last_logged_date'),
  freezeCredits: integer('freeze_credits').default(2),
  totalLoggedDays: integer('total_logged_days').default(0),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const mealStreaksRelations = relations(mealStreaks, ({ one }) => ({
  user: one(users, {
    fields: [mealStreaks.userId],
    references: [users.id],
  }),
}));

// Daily summaries for analytics
export const dailySummaries = sqliteTable('daily_summaries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  totalCalories: real('total_calories').default(0),
  totalProteinG: real('total_protein_g').default(0),
  totalCarbsG: real('total_carbs_g').default(0),
  totalFatG: real('total_fat_g').default(0),
  mealCount: integer('meal_count').default(0),
  targetCalories: real('target_calories'),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const dailySummariesRelations = relations(dailySummaries, ({ one }) => ({
  user: one(users, {
    fields: [dailySummaries.userId],
    references: [users.id],
  }),
}));

// Favorite foods for quick logging
export const favoriteFoods = sqliteTable('favorite_foods', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  foodName: text('food_name').notNull(),
  calories: real('calories').notNull(),
  proteinG: real('protein_g').default(0),
  carbsG: real('carbs_g').default(0),
  fatG: real('fat_g').default(0),
  servingSize: text('serving_size'),
  servingUnit: text('serving_unit'),
  category: text('category'),
  usageCount: integer('usage_count').default(0),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const favoriteFoodsRelations = relations(favoriteFoods, ({ one }) => ({
  user: one(users, {
    fields: [favoriteFoods.userId],
    references: [users.id],
  }),
}));

// Food database for search
export const foods = sqliteTable('foods', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  brand: text('brand'),
  caloriesPer100g: real('calories_per_100g').notNull(),
  proteinPer100g: real('protein_per_100g').default(0),
  carbsPer100g: real('carbs_per_100g').default(0),
  fatPer100g: real('fat_per_100g').default(0),
  servingSizeG: real('serving_size_g'),
  servingDescription: text('serving_description'),
  category: text('category'),
  createdAt: text('created_at').default(new Date().toISOString()),
});

