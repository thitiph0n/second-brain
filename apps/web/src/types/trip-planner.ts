// Type definitions for trip planner feature
// These types match the backend validation schemas

export type TripStatus = "upcoming" | "ongoing" | "past";

// Trip types
export interface CreateTripRequest {
	name: string;
	description?: string | null;
	startDate: string; // YYYY-MM-DD format
	endDate: string; // YYYY-MM-DD format
	coverImage?: string | null;
}

export interface UpdateTripRequest {
	name?: string;
	description?: string | null;
	startDate?: string;
	endDate?: string;
	coverImage?: string | null;
}

export interface TripResponse {
	id: string;
	name: string;
	description: string | null;
	startDate: string;
	endDate: string;
	status: TripStatus;
	coverImageUrl: string | null;
	isPublic: boolean;
	shareToken: string | null;
	sharedAt: string | null;
	createdAt: string;
	updatedAt: string;
	itineraryItems?: ItineraryItemResponse[];
	_count?: {
		itineraryItems: number;
	};
}

export interface TripsQuery {
	status?: TripStatus;
	limit?: number;
	offset?: number;
}

// Itinerary types
export interface CreateItineraryItemRequest {
	placeName: string;
	dayNumber: number;
	time?: string | null; // HH:MM format
	locationAddress?: string | null;
	locationLat?: number;
	locationLng?: number;
	notes?: string | null;
	sortOrder?: number;
}

export interface UpdateItineraryItemRequest {
	placeName?: string;
	time?: string | null;
	locationAddress?: string | null;
	locationLat?: number;
	locationLng?: number;
	notes?: string | null;
	sortOrder?: number;
	dayNumber?: number;
}

export interface ItineraryImage {
	id: string;
	imageUrl: string;
	imageKey: string;
	caption: string | null;
	sortOrder: number;
	createdAt: string;
}

export interface ItineraryItemResponse {
	id: string;
	tripId: string;
	dayNumber: number;
	time: string | null;
	placeName: string;
	locationAddress: string | null;
	locationLat: number | null;
	locationLng: number | null;
	googleMapsUrl: string | null;
	notes: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	images?: ItineraryImage[];
}

export interface ItineraryReorderItem {
	itemId: string;
	sortOrder: number;
}

// Sharing types
export interface SharingToggleRequest {
	isPublic: boolean;
	generateShareToken?: boolean;
}

export interface ShareTokenResponse {
	shareUrl?: string;
	shareToken: string;
	isEnabled: boolean;
}

export interface PublicTripResponse {
	id: string;
	name: string;
	description: string | null;
	startDate: string;
	endDate: string;
	status: TripStatus;
	coverImageUrl: string | null;
	itineraryItems: ItineraryItemResponse[];
	createdAt: string;
	updatedAt: string;
}

// API response types
export interface TripsListResponse {
	trips: TripResponse[];
	total: number;
}

export interface TripDetailResponse {
	trip: TripResponse;
}

export interface ItineraryItemsResponse {
	items: ItineraryItemResponse[];
	total: number;
}

export interface ItineraryItemDetailResponse {
	itineraryItem: ItineraryItemResponse;
}
