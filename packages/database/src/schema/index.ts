import { relations } from 'drizzle-orm';
import { users, oauthProviders, authSessions, oauthProvidersRelations, authSessionsRelations } from './auth';
import { coupons, couponsRelations } from './coupons';
import { drawings, drawingAssets, drawingsRelations, drawingAssetsRelations } from './drawings';
import { userProfiles, meals, mealStreaks, dailySummaries, favoriteFoods, foods, userProfilesRelations, mealsRelations, mealStreaksRelations, dailySummariesRelations, favoriteFoodsRelations } from './meal-tracker';
import { trips, itineraryItems, itineraryImages, tripsRelations, itineraryItemsRelations, itineraryImagesRelations } from './trip-planner';

// Complete relations for users table
export const usersRelations = relations(users, ({ many }) => ({
  oauthProviders: many(oauthProviders),
  authSessions: many(authSessions),
  coupons: many(coupons),
  drawings: many(drawings),
  drawingAssets: many(drawingAssets),
  userProfiles: many(userProfiles),
  meals: many(meals),
  mealStreaks: many(mealStreaks),
  dailySummaries: many(dailySummaries),
  favoriteFoods: many(favoriteFoods),
  trips: many(trips),
}));

// Export all tables
export {
  users,
  oauthProviders,
  authSessions,
  coupons,
  drawings,
  drawingAssets,
  userProfiles,
  meals,
  mealStreaks,
  dailySummaries,
  favoriteFoods,
  foods,
  trips,
  itineraryItems,
  itineraryImages,
};

// Export all relations
export {
  oauthProvidersRelations,
  authSessionsRelations,
  couponsRelations,
  drawingsRelations,
  drawingAssetsRelations,
  userProfilesRelations,
  mealsRelations,
  mealStreaksRelations,
  dailySummariesRelations,
  favoriteFoodsRelations,
  tripsRelations,
  itineraryItemsRelations,
  itineraryImagesRelations,
};