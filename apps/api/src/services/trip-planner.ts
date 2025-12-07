// Comprehensive Trip Planner Service for business logic, calculations, and database operations

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
  ilike,
  inArray
} from 'drizzle-orm';
import {
  trips,
  itineraryItems,
  itineraryImages
} from '@second-brain/database/schema';
import type {
  CreateTripRequest,
  UpdateTripRequest,
  TripResponse,
  TripsQuery,
  CreateItineraryItemRequest,
  UpdateItineraryItemRequest,
  ItineraryItemResponse,
  ItineraryReorderRequest,
  SharingToggleRequest,
  ShareTokenResponse,
  PublicTripResponse,
  TripStatus
} from '../validation/trip-planner';

/**
 * Helper function to generate Google Maps URL from location data
 */
function generateGoogleMapsUrl(address: string | null | undefined, lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (lat != null && lng != null) {
    // Using coordinates
    return `https://www.google.com/maps?q=${lat},${lng}`;
  } else if (address) {
    // Using address
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps?q=${encodedAddress}`;
  }
  return null;
}

/**
 * Helper function to calculate trip status based on dates
 */
function calculateTripStatus(startDate: string, endDate: string): TripStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today < start) {
    return 'upcoming';
  } else if (today >= start && today <= end) {
    return 'ongoing';
  } else {
    return 'past';
  }
}

/**
 * Helper function to generate secure share token
 */
function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 32);
}

/**
 * Helper function to validate share token format
 */
function isValidShareToken(token: string): boolean {
  return /^[a-f0-9]{32}$/i.test(token);
}

export class TripPlannerService {
  private db: ReturnType<typeof drizzle>;

  constructor(d1Database: D1Database) {
    this.db = drizzle(d1Database);
  }

  // Trip Management Service

  /**
   * Create a new trip
   */
  async createTrip(userId: string, tripData: CreateTripRequest): Promise<TripResponse> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const status = calculateTripStatus(tripData.startDate, tripData.endDate);

      const result = await this.db
        .insert(trips)
        .values({
          id,
          userId,
          name: tripData.name,
          description: tripData.description ?? null,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          coverImageUrl: tripData.coverImage ?? null,
          isPublic: false,
          shareToken: null,
          sharedAt: null,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get();

      return this.transformTripResponse(result);
    } catch (error) {
      console.error('Error in createTrip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create trip: ${errorMessage}`);
    }
  }

  /**
   * Get trip by ID with ownership validation
   */
  async getTripById(id: string, userId?: string): Promise<TripResponse | null> {
    try {
      const result = await this.db
        .select()
        .from(trips)
        .where(userId
          ? and(eq(trips.id, id), eq(trips.userId, userId))
          : eq(trips.id, id)
        )
        .get();

      if (!result) {
        return null;
      }

      return this.transformTripResponse(result);
    } catch (error) {
      console.error('Error in getTripById:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch trip: ${errorMessage}`);
    }
  }

  /**
   * Get all trips for a user with filtering
   */
  async getTripsByUser(userId: string, query: TripsQuery): Promise<{ trips: TripResponse[]; total: number }> {
    try {
      const { status, limit, offset } = query;

      // Build where conditions
      const conditions = [eq(trips.userId, userId)];

      // Add status filter if provided
      if (status) {
        const now = new Date().toISOString().split('T')[0];

        if (status === 'upcoming') {
          conditions.push(gte(trips.startDate, now));
        } else if (status === 'ongoing') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          conditions.push(
            gte(trips.startDate, today.toISOString().split('T')[0]),
            lte(trips.endDate, today.toISOString().split('T')[0])
          );
        } else if (status === 'past') {
          conditions.push(lt(trips.endDate, now));
        }
      }

      // Get total count
      const allResults = await this.db
        .select()
        .from(trips)
        .where(and(...conditions))
        .all();
      const total = allResults.length;

      // Apply pagination and sorting
      const result = await this.db
        .select()
        .from(trips)
        .where(and(...conditions))
        .orderBy(desc(trips.startDate))
        .limit(limit)
        .offset(offset)
        .all();

      const tripsWithItinerary = await Promise.all(
        result.map(async (trip) => {
          const itineraryResponse = await this.getItineraryItemsByTrip(trip.id);
          return {
            ...trip,
            itineraryItems: itineraryResponse.items
          };
        })
      );

      return {
        trips: tripsWithItinerary.map(t => this.transformTripResponse(t)),
        total
      };
    } catch (error) {
      console.error('Error in getTripsByUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch trips: ${errorMessage}`);
    }
  }

  /**
   * Update an existing trip
   */
  async updateTrip(id: string, userId: string, tripData: UpdateTripRequest): Promise<TripResponse | null> {
    try {
      // Check ownership and existence
      const existingTrip = await this.getTripById(id, userId);
      if (!existingTrip) {
        return null;
      }

      const now = new Date().toISOString();

      const updateData: Partial<typeof trips.$inferInsert> = {
        updatedAt: now
      };

      if (tripData.name !== undefined) updateData.name = tripData.name;
      if (tripData.description !== undefined) updateData.description = tripData.description;
      if (tripData.startDate !== undefined) updateData.startDate = tripData.startDate;
      if (tripData.endDate !== undefined) updateData.endDate = tripData.endDate;
      if (tripData.coverImage !== undefined) updateData.coverImageUrl = tripData.coverImage;

      // Re-calculate status if dates changed
      if (tripData.startDate || tripData.endDate) {
        const startDate = tripData.startDate || existingTrip.startDate;
        const endDate = tripData.endDate || existingTrip.endDate;
        // Note: We can't update the status column directly in the update
        // Status will be calculated on the fly in the response
      }

      const result = await this.db
        .update(trips)
        .set(updateData)
        .where(and(eq(trips.id, id), eq(trips.userId, userId)))
        .returning()
        .get();

      return this.transformTripResponse(result);
    } catch (error) {
      console.error('Error in updateTrip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update trip: ${errorMessage}`);
    }
  }

  /**
   * Delete a trip and all related data
   */
  async deleteTrip(id: string, userId: string): Promise<boolean> {
    try {
      // Check ownership
      const existingTrip = await this.getTripById(id, userId);
      if (!existingTrip) {
        return false;
      }

      // Delete trip (cascades to itinerary items and images)
      await this.db
        .delete(trips)
        .where(and(eq(trips.id, id), eq(trips.userId, userId)))
        .run();

      return true;
    } catch (error) {
      console.error('Error in deleteTrip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete trip: ${errorMessage}`);
    }
  }

  /**
   * Toggle public sharing for a trip
   */
  async toggleSharing(id: string, userId: string, sharingData: SharingToggleRequest): Promise<ShareTokenResponse | null> {
    try {
      // Check ownership
      const existingTrip = await this.getTripById(id, userId);
      if (!existingTrip) {
        return null;
      }

      const now = new Date().toISOString();
      let shareToken: string | null = null;
      let shareUrl: string = '';

      if (sharingData.isPublic) {
        // Generate new share token if enabling sharing
        shareToken = generateShareToken();
        // shareUrl should be constructed by the frontend using the FRONTEND_URL
      }

      const result = await this.db
        .update(trips)
        .set({
          isPublic: sharingData.isPublic,
          shareToken: sharingData.isPublic ? shareToken : null,
          sharedAt: sharingData.isPublic ? now : null,
          updatedAt: now
        })
        .where(and(eq(trips.id, id), eq(trips.userId, userId)))
        .returning()
        .get();

      return {
        shareUrl: sharingData.isPublic ? shareUrl : undefined,
        shareToken: result.shareToken || '',
        isEnabled: Boolean(result.isPublic)
      };
    } catch (error) {
      console.error('Error in toggleSharing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to toggle sharing: ${errorMessage}`);
    }
  }

  /**
   * Get public trip by share token
   */
  async getPublicTripByShareToken(shareToken: string): Promise<PublicTripResponse | null> {
    try {
      // Validate share token format
      if (!isValidShareToken(shareToken)) {
        return null;
      }

      const result = await this.db
        .select()
        .from(trips)
        .where(
          and(
            eq(trips.shareToken, shareToken),
            eq(trips.isPublic, true)
          )
        )
        .get();

      if (!result) {
        return null;
      }

      return this.transformPublicTripResponse(result);
    } catch (error) {
      console.error('Error in getPublicTripByShareToken:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch public trip: ${errorMessage}`);
    }
  }

  // Itinerary Management Service

  /**
   * Get all itinerary items for a trip with images
   */
  async getItineraryItemsByTrip(tripId: string): Promise<{ items: ItineraryItemResponse[]; total: number }> {
    try {
      const items = await this.db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.tripId, tripId))
        .orderBy(asc(itineraryItems.dayNumber), asc(itineraryItems.sortOrder))
        .all();

      const total = items.length;

      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const images = await this.db
            .select()
            .from(itineraryImages)
            .where(eq(itineraryImages.itineraryItemId, item.id))
            .orderBy(asc(itineraryImages.sortOrder))
            .all();

          return {
            ...item,
            images: images || []
          };
        })
      );

      return {
        items: itemsWithImages as any,
        total
      };
    } catch (error) {
      console.error('Error in getItineraryItemsByTrip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch itinerary items: ${errorMessage}`);
    }
  }

  /**
   * Create a new itinerary item
   */
  async createItineraryItem(
    tripId: string,
    userId: string,
    itemData: CreateItineraryItemRequest
  ): Promise<ItineraryItemResponse> {
    try {
      // Verify trip ownership
      const trip = await this.getTripById(tripId, userId);
      if (!trip) {
        throw new Error('Trip not found or access denied');
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Calculate day number based on trip dates
      const tripStart = new Date(trip.startDate);
      const itemDate = new Date(); // Default to today for new items
      const dayNumber = Math.floor((itemDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const googleMapsUrl = generateGoogleMapsUrl(
        itemData.locationAddress,
        itemData.locationLat,
        itemData.locationLng
      );

      const result = await this.db
        .insert(itineraryItems)
        .values({
          id,
          tripId,
          dayNumber,
          time: itemData.time || null,
          placeName: itemData.placeName,
          locationAddress: itemData.locationAddress || null,
          locationLat: itemData.locationLat,
          locationLng: itemData.locationLng,
          googleMapsUrl,
          notes: itemData.notes || null,
          sortOrder: itemData.sortOrder || 0,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get();

      return this.transformItineraryItemResponse(result);
    } catch (error) {
      console.error('Error in createItineraryItem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create itinerary item: ${errorMessage}`);
    }
  }

  /**
   * Update an itinerary item
   */
  async updateItineraryItem(
    tripId: string,
    itemId: string,
    userId: string,
    itemData: UpdateItineraryItemRequest
  ): Promise<ItineraryItemResponse | null> {
    try {
      // Verify trip ownership and item existence
      const existingItem = await this.getItineraryItemById(tripId, itemId, userId);
      if (!existingItem) {
        return null;
      }

      const now = new Date().toISOString();

      // Generate new Google Maps URL if location changed
      let googleMapsUrl = existingItem.googleMapsUrl;
      if (
        itemData.locationAddress !== undefined ||
        itemData.locationLat !== undefined ||
        itemData.locationLng !== undefined
      ) {
        googleMapsUrl = generateGoogleMapsUrl(
          itemData.locationAddress ?? existingItem.locationAddress ?? undefined,
          itemData.locationLat ?? existingItem.locationLat,
          itemData.locationLng ?? existingItem.locationLng
        );
      }

      const updateData: Partial<typeof itineraryItems.$inferInsert> = {
        updatedAt: now
      };

      if (itemData.placeName !== undefined) updateData.placeName = itemData.placeName;
      if (itemData.time !== undefined) updateData.time = itemData.time;
      if (itemData.locationAddress !== undefined) updateData.locationAddress = itemData.locationAddress;
      if (itemData.locationLat !== undefined) updateData.locationLat = itemData.locationLat;
      if (itemData.locationLng !== undefined) updateData.locationLng = itemData.locationLng;
      if (itemData.notes !== undefined) updateData.notes = itemData.notes;
      if (itemData.sortOrder !== undefined) updateData.sortOrder = itemData.sortOrder;
      if (googleMapsUrl) updateData.googleMapsUrl = googleMapsUrl;

      const result = await this.db
        .update(itineraryItems)
        .set(updateData)
        .where(
          and(
            eq(itineraryItems.id, itemId),
            eq(itineraryItems.tripId, tripId)
          )
        )
        .returning()
        .get();

      return this.transformItineraryItemResponse(result);
    } catch (error) {
      console.error('Error in updateItineraryItem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update itinerary item: ${errorMessage}`);
    }
  }

  /**
   * Delete an itinerary item
   */
  async deleteItineraryItem(tripId: string, itemId: string, userId: string): Promise<boolean> {
    try {
      // Verify trip ownership and item existence
      const existingItem = await this.getItineraryItemById(tripId, itemId, userId);
      if (!existingItem) {
        return false;
      }

      await this.db
        .delete(itineraryItems)
        .where(
          and(
            eq(itineraryItems.id, itemId),
            eq(itineraryItems.tripId, tripId)
          )
        )
        .run();

      return true;
    } catch (error) {
      console.error('Error in deleteItineraryItem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete itinerary item: ${errorMessage}`);
    }
  }

  /**
   * Reorder itinerary items within a trip
   */
  async reorderItineraryItems(
    tripId: string,
    userId: string,
    reorderData: ItineraryReorderRequest
  ): Promise<ItineraryItemResponse[]> {
    try {
      // Verify trip ownership
      const trip = await this.getTripById(tripId, userId);
      if (!trip) {
        throw new Error('Trip not found or access denied');
      }

      const now = new Date().toISOString();

      // Update sort orders for all specified items
      const updatePromises = reorderData.map(({ itemId, sortOrder }) =>
        this.db
          .update(itineraryItems)
          .set({
            sortOrder,
            updatedAt: now
          })
          .where(
            and(
              eq(itineraryItems.id, itemId),
              eq(itineraryItems.tripId, tripId)
            )
          )
          .run()
      );

      await Promise.all(updatePromises);

      // Return updated items
      const result = await this.db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.tripId, tripId))
        .orderBy(asc(itineraryItems.dayNumber), asc(itineraryItems.sortOrder))
        .all();

      return result.map(item => this.transformItineraryItemResponse(item));
    } catch (error) {
      console.error('Error in reorderItineraryItems:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to reorder itinerary items: ${errorMessage}`);
    }
  }

  // Image Management Service

  /**
   * Record a new image for an itinerary item
   */
  async createItineraryImage(
    tripId: string,
    itineraryItemId: string,
    userId: string,
    imageData: {
      imageUrl: string;
      imageKey: string;
      caption?: string;
    }
  ) {
    try {
      // Verify ownership via itinerary item
      const item = await this.getItineraryItemById(tripId, itineraryItemId, userId);
      if (!item) {
        throw new Error('Itinerary item not found or access denied');
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const result = await this.db
        .insert(itineraryImages)
        .values({
          id,
          itineraryItemId,
          imageUrl: imageData.imageUrl,
          imageKey: imageData.imageKey,
          caption: imageData.caption,
          sortOrder: 0, // Default to 0, append functionality could be added later
          createdAt: now
        })
        .returning()
        .get();

      return result;
    } catch (error) {
      console.error('Error in createItineraryImage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create itinerary image: ${errorMessage}`);
    }
  }

  /**
   * Delete an itinerary image
   */
  async deleteItineraryImage(
    tripId: string,
    itineraryItemId: string,
    imageId: string,
    userId: string
  ): Promise<{ imageKey: string } | null> {
    try {
      // Verify ownership via itinerary item
      const item = await this.getItineraryItemById(tripId, itineraryItemId, userId);
      if (!item) {
        return null;
      }

      // Get image to return key for R2 deletion
      const image = await this.db
        .select()
        .from(itineraryImages)
        .where(
            and(
                eq(itineraryImages.id, imageId),
                eq(itineraryImages.itineraryItemId, itineraryItemId)
            )
        )
        .get();

      if (!image) {
        return null;
      }

      // Delete from database
      await this.db
        .delete(itineraryImages)
        .where(eq(itineraryImages.id, imageId))
        .run();

      return { imageKey: image.imageKey || '' };
    } catch (error) {
      console.error('Error in deleteItineraryImage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete itinerary image: ${errorMessage}`);
    }
  }


  // Helper Methods

  /**
   * Get itinerary item by ID with ownership validation
   */
  private async getItineraryItemById(tripId: string, itemId: string, userId: string): Promise<ItineraryItemResponse | null> {
    try {
      const trip = await this.getTripById(tripId, userId);
      if (!trip) {
        return null;
      }

      const result = await this.db
        .select()
        .from(itineraryItems)
        .where(
          and(
            eq(itineraryItems.id, itemId),
            eq(itineraryItems.tripId, tripId)
          )
        )
        .get();

      return result ? this.transformItineraryItemResponse(result) : null;
    } catch (error) {
      console.error('Error in getItineraryItemById:', error);
      throw error;
    }
  }

  /**
   * Transform trip database record to response format
   */
  private transformTripResponse(trip: typeof trips.$inferSelect): TripResponse {
    return {
      id: trip.id,
      name: trip.name,
      description: trip.description ?? null,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: calculateTripStatus(trip.startDate, trip.endDate),
      coverImageUrl: trip.coverImageUrl,
      isPublic: trip.isPublic ?? false,
      shareToken: trip.shareToken,
      sharedAt: trip.sharedAt,
      createdAt: trip.createdAt || '',
      updatedAt: trip.updatedAt || '',
      itineraryItems: [],
      _count: {
        itineraryItems: 0 // This would need to be calculated with a separate query
      }
    };
  }

  /**
   * Transform itinerary item database record to response format
   */
  private transformItineraryItemResponse(item: typeof itineraryItems.$inferSelect): ItineraryItemResponse {
    return {
      id: item.id,
      tripId: item.tripId,
      dayNumber: item.dayNumber,
      time: item.time,
      placeName: item.placeName,
      locationAddress: item.locationAddress,
      locationLat: item.locationLat,
      locationLng: item.locationLng,
      googleMapsUrl: item.googleMapsUrl,
      notes: item.notes,
      sortOrder: item.sortOrder || 0,
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || '',
      images: []
    };
  }

  /**
   * Transform trip to public response format (read-only)
   */
  private transformPublicTripResponse(trip: typeof trips.$inferSelect): PublicTripResponse {
    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: calculateTripStatus(trip.startDate, trip.endDate),
      coverImageUrl: trip.coverImageUrl,
      itineraryItems: [], // Would need to be populated separately
      createdAt: trip.createdAt || '',
      updatedAt: trip.updatedAt || ''
    };
  }
}