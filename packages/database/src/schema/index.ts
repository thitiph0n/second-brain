import { relations } from 'drizzle-orm';
import { users, oauthProviders, authSessions, oauthProvidersRelations, authSessionsRelations } from './auth';
import { coupons, couponsRelations } from './coupons';
import { drawings, drawingAssets, drawingsRelations, drawingAssetsRelations } from './drawings';

// Complete relations for users table
export const usersRelations = relations(users, ({ many }) => ({
  oauthProviders: many(oauthProviders),
  authSessions: many(authSessions),
  coupons: many(coupons),
  drawings: many(drawings),
  drawingAssets: many(drawingAssets),
}));

// Export all tables
export {
  users,
  oauthProviders,
  authSessions,
  coupons,
  drawings,
  drawingAssets,
};

// Export all relations
export {
  oauthProvidersRelations,
  authSessionsRelations,
  couponsRelations,
  drawingsRelations,
  drawingAssetsRelations,
};