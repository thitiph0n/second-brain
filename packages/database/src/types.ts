// Export Drizzle table types for use throughout the application
import type {
  users,
  oauthProviders,
  authSessions,
  coupons,
  drawings,
  drawingAssets,
} from './schema';

// Extract the type from the Drizzle schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OAuthProvider = typeof oauthProviders.$inferSelect;
export type NewOAuthProvider = typeof oauthProviders.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type Drawing = typeof drawings.$inferSelect;
export type NewDrawing = typeof drawings.$inferInsert;
export type DrawingAsset = typeof drawingAssets.$inferSelect;
export type NewDrawingAsset = typeof drawingAssets.$inferInsert;