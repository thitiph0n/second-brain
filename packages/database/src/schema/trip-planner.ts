import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

// Trips table
export const trips = sqliteTable('trips', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  coverImageUrl: text('cover_image_url'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  shareToken: text('share_token').unique(),
  sharedAt: text('shared_at'),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

// Itinerary items table
export const itineraryItems = sqliteTable('itinerary_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  time: text('time'),
  placeName: text('place_name').notNull(),
  locationAddress: text('location_address'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  googleMapsUrl: text('google_maps_url'),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

// Itinerary images table
export const itineraryImages = sqliteTable('itinerary_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  itineraryItemId: text('itinerary_item_id').notNull().references(() => itineraryItems.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  imageKey: text('image_key'),
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default(new Date().toISOString()),
});

// Relations
export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  itineraryItems: many(itineraryItems),
}));

export const itineraryItemsRelations = relations(itineraryItems, ({ one, many }) => ({
  trip: one(trips, {
    fields: [itineraryItems.tripId],
    references: [trips.id],
  }),
  images: many(itineraryImages),
}));

export const itineraryImagesRelations = relations(itineraryImages, ({ one }) => ({
  itineraryItem: one(itineraryItems, {
    fields: [itineraryImages.itineraryItemId],
    references: [itineraryItems.id],
  }),
}));