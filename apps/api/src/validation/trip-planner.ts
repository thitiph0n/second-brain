// Comprehensive validation schemas for trip planner feature

import { z } from 'zod';

// Basic types
export type TripStatus = 'upcoming' | 'ongoing' | 'past';

// Trip Management Schema Types
export type CreateTripRequest = z.infer<typeof createTripSchema>;
export type UpdateTripRequest = z.infer<typeof updateTripSchema>;
export type TripResponse = z.infer<typeof tripResponseSchema>;
export type TripsQuery = z.infer<typeof tripsQuerySchema>;
export type SharingToggleRequest = z.infer<typeof sharingToggleSchema>;

// Itinerary Management Schema Types
export type CreateItineraryItemRequest = z.infer<typeof createItineraryItemSchema>;
export type UpdateItineraryItemRequest = z.infer<typeof updateItineraryItemSchema>;
export type ItineraryItemResponse = z.infer<typeof itineraryItemResponseSchema>;
export type ItineraryReorderRequest = z.infer<typeof itineraryReorderSchema>;

// Image Management Schema Types
export type ImageUploadRequest = z.infer<typeof imageUploadSchema>;

// Share Token Response Type
export type ShareTokenResponse = z.infer<typeof shareTokenResponseSchema>;

// Public Trip Response Type
export type PublicTripResponse = z.infer<typeof publicTripResponseSchema>;

// Trip Management Schemas

/**
 * Schema for creating a new trip
 */
export const createTripSchema = z.object({
  name: z.string()
    .min(1, 'Trip name is required')
    .max(100, 'Trip name must be less than 100 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  startDate: z.string()
    .min(1, 'Start date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string()
    .min(1, 'End date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  coverImage: z.string()
    .url('Cover image must be a valid URL')
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing trip
 */
export const updateTripSchema = z.object({
  name: z.string()
    .min(1, 'Trip name is required')
    .max(100, 'Trip name must be less than 100 characters')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  coverImage: z.string()
    .url('Cover image must be a valid URL')
    .optional()
    .nullable(),
}).refine(data => {
  // If both dates are provided, end date must be after start date
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

/**
 * Schema for trip response with itinerary
 */
export const tripResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['upcoming', 'ongoing', 'past']),
  coverImageUrl: z.string().nullable(),
  isPublic: z.boolean(),
  shareToken: z.string().nullable(),
  sharedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  itineraryItems: z.array(z.lazy(() => itineraryItemResponseSchema)).optional(),
  _count: z.object({
    itineraryItems: z.number(),
  }).optional(),
});

/**
 * Schema for querying trips
 */
export const tripsQuerySchema = z.object({
  status: z.enum(['upcoming', 'ongoing', 'past']).optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('50'),
  offset: z.string()
    .regex(/^\d+$/, 'Offset must be a number')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 0, 'Offset must be non-negative')
    .optional()
    .default('0'),
});

/**
 * Schema for toggling public sharing
 */
export const sharingToggleSchema = z.object({
  isPublic: z.boolean(),
  generateShareToken: z.boolean().optional(),
});

// Itinerary Management Schemas

/**
 * Schema for creating a new itinerary item
 */
export const createItineraryItemSchema = z.object({
  placeName: z.string()
    .min(1, 'Place name is required')
    .max(200, 'Place name must be less than 200 characters'),
  time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .nullable(),
  locationAddress: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .nullable(),
  locationLat: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  locationLng: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
  sortOrder: z.number()
    .min(0, 'Sort order must be non-negative')
    .optional(),
});

/**
 * Schema for updating an itinerary item
 */
export const updateItineraryItemSchema = z.object({
  placeName: z.string()
    .min(1, 'Place name is required')
    .max(200, 'Place name must be less than 200 characters')
    .optional(),
  time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .nullable(),
  locationAddress: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .nullable(),
  locationLat: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  locationLng: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
  sortOrder: z.number()
    .min(0, 'Sort order must be non-negative')
    .optional(),
}).refine(data => {
  // If lat/lng are provided, both must be present
  if ((data.locationLat !== undefined && data.locationLat !== null) !==
      (data.locationLng !== undefined && data.locationLng !== null)) {
    return false;
  }
  return true;
}, {
  message: 'Both latitude and longitude must be provided together',
  path: ['locationLat'],
});

/**
 * Schema for itinerary item response with images
 */
export const itineraryItemResponseSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  dayNumber: z.number(),
  time: z.string().nullable(),
  placeName: z.string(),
  locationAddress: z.string().nullable(),
  locationLat: z.number().nullable(),
  locationLng: z.number().nullable(),
  googleMapsUrl: z.string().nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  images: z.array(z.object({
    id: z.string(),
    imageUrl: z.string(),
    imageKey: z.string(),
    caption: z.string().nullable(),
    sortOrder: z.number(),
    createdAt: z.string(),
  })).optional(),
});

/**
 * Schema for reordering itinerary items
 */
export const itineraryReorderSchema = z.array(
  z.object({
    itemId: z.string(),
    sortOrder: z.number()
      .min(0, 'Sort order must be non-negative'),
  })
).min(1, 'At least one item must be provided');

// Image Management Schema

/**
 * Schema for image upload (multipart form)
 */
export const imageUploadSchema = z.object({
  image: z.any(), // File object from multipart form
  caption: z.string()
    .max(200, 'Caption must be less than 200 characters')
    .optional()
    .nullable(),
});

// Share Token Response Schema

/**
 * Schema for share token response
 */
export const shareTokenResponseSchema = z.object({
  shareUrl: z.string().optional(),
  shareToken: z.string(),
  isEnabled: z.boolean(),
});

// Public Trip Response Schema

/**
 * Schema for public trip response (read-only)
 */
export const publicTripResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['upcoming', 'ongoing', 'past']),
  coverImageUrl: z.string().nullable(),
  itineraryItems: z.array(itineraryItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Validation utility functions

/**
 * Validate and create trip data from request
 */
export function validateCreateTrip(data: unknown): CreateTripRequest {
  return createTripSchema.parse(data);
}

/**
 * Validate and update trip data from request
 */
export function validateUpdateTrip(data: unknown): UpdateTripRequest {
  return updateTripSchema.parse(data);
}

/**
 * Validate trip response data
 */
export function validateTripResponse(data: unknown): TripResponse {
  return tripResponseSchema.parse(data);
}

/**
 * Validate trips query parameters
 */
export function validateTripsQuery(data: unknown): TripsQuery {
  return tripsQuerySchema.parse(data);
}

/**
 * Validate sharing toggle request
 */
export function validateSharingToggle(data: unknown): SharingToggleRequest {
  return sharingToggleSchema.parse(data);
}

/**
 * Validate and create itinerary item data from request
 */
export function validateCreateItineraryItem(data: unknown): CreateItineraryItemRequest {
  return createItineraryItemSchema.parse(data);
}

/**
 * Validate and update itinerary item data from request
 */
export function validateUpdateItineraryItem(data: unknown): UpdateItineraryItemRequest {
  return updateItineraryItemSchema.parse(data);
}

/**
 * Validate itinerary item response data
 */
export function validateItineraryItemResponse(data: unknown): ItineraryItemResponse {
  return itineraryItemResponseSchema.parse(data);
}

/**
 * Validate itinerary reorder request
 */
export function validateItineraryReorder(data: unknown): ItineraryReorderRequest {
  return itineraryReorderSchema.parse(data);
}

/**
 * Validate image upload data
 */
export function validateImageUpload(data: unknown): ImageUploadRequest {
  return imageUploadSchema.parse(data);
}

/**
 * Validate share token response data
 */
export function validateShareTokenResponse(data: unknown): ShareTokenResponse {
  return shareTokenResponseSchema.parse(data);
}

/**
 * Validate public trip response data
 */
export function validatePublicTripResponse(data: unknown): PublicTripResponse {
  return publicTripResponseSchema.parse(data);
}