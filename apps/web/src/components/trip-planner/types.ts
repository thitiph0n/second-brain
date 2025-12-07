export interface Trip {
	id: string;
	name: string;
	description?: string;
	startDate: string;
	endDate: string;
	status: TripStatus;
	isPublic: boolean;
	sharedAt?: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	itinerary?: ItineraryItem[];
}

export type TripStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface CreateTripData {
	name: string;
	description?: string;
	startDate: string;
	endDate: string;
	isPublic?: boolean;
}

export interface UpdateTripData extends Partial<CreateTripData> {
	status?: TripStatus;
}

export interface ItineraryItem {
	id: string;
	tripId: string;
	dayNumber: number;
	title: string;
	description?: string;
	location?: Location;
	notes?: string;
	category: ItineraryCategory;
	startTime?: string;
	endTime?: string;
	estimatedDuration?: number;
	isRequired: boolean;
	isCompleted: boolean;
	order: number;
	images?: ItineraryImage[];
	createdAt: string;
	updatedAt: string;
}

export type ItineraryCategory =
	| "accommodation"
	| "transportation"
	| "activity"
	| "dining"
	| "shopping"
	| "attraction"
	| "rest"
	| "other";

export interface Location {
	address?: string;
	city?: string;
	country?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	placeId?: string; // For Google Places API
}

export interface ItineraryImage {
	id: string;
	url: string;
	altText?: string;
	width?: number;
	height?: number;
	uploadedAt: string;
	file?: File; // For client-side pending uploads
}

export interface CreateItineraryItemData {
	tripId: string;
	dayNumber: number;
	title: string;
	description?: string;
	location?: Location;
	notes?: string;
	category: ItineraryCategory;
	startTime?: string;
	endTime?: string;
	estimatedDuration?: number;
	isRequired: boolean;
	order: number;
}

export interface UpdateItineraryItemData extends Partial<CreateItineraryItemData> {
	isCompleted?: boolean;
}

export interface ShareTripData {
	isPublic: boolean;
	sharedAt?: string;
}

export interface TripFilters {
	status?: TripStatus[];
	search?: string;
	dateFrom?: string;
	dateTo?: string;
	category?: ItineraryCategory;
}

export interface TimelineDay {
	dayNumber: number;
	date: string;
	items: ItineraryItem[];
}

export interface TripStats {
	totalDays: number;
	completedItems: number;
	totalItems: number;
	overallProgress: number;
	upcomingItems: number;
}

export interface LocationSuggestion {
	placeId: string;
	description: string;
	mainText: string;
	secondaryText: string;
	structuredFormatting?: {
		mainText: string;
		secondaryText: string;
	};
}

export interface NotesEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	maxLength?: number;
	readOnly?: boolean;
	className?: string;
}