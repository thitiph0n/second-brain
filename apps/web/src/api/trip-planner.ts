// API client for trip planner feature
import type {
	CreateTripRequest,
	UpdateTripRequest,
	TripsQuery,
	TripsListResponse,
	TripDetailResponse,
	CreateItineraryItemRequest,
	UpdateItineraryItemRequest,
	ItineraryItemResponse,
	ItineraryItemsResponse,
	ItineraryItemDetailResponse,
	ItineraryReorderItem,
	SharingToggleRequest,
	ShareTokenResponse,
	PublicTripResponse,
	ItineraryImage,
} from "@/types/trip-planner";

const API_BASE_URL =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.PROD ? "https://2b.thitiphon.me" : "http://localhost:8787");

class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
	// Get token from Zustand auth store
	const authData = localStorage.getItem("auth-storage");
	let token = null;

	if (authData) {
		try {
			const parsed = JSON.parse(authData);
			token = parsed.state?.accessToken;
		} catch (_e) {
			// Invalid JSON in storage
		}
	}

	if (!token) {
		throw new ApiError(401, "No authentication token found");
	}

	const response = await fetch(`${API_BASE_URL}/api/v1/trip-planner${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});

	if (!response.ok) {
		let errorData: { error: string; details?: string; timestamp?: string };
		try {
			errorData = await response.json();
		} catch (_e) {
			errorData = { error: "Failed to parse error response" };
		}

		// Create detailed error message
		let errorMessage = errorData.error || "Request failed";
		if (errorData.details) {
			errorMessage += ` - ${errorData.details}`;
		}
		if (errorData.timestamp) {
			errorMessage += ` (${errorData.timestamp})`;
		}

		throw new ApiError(response.status, errorMessage);
	}

	return response.json();
}

export const tripPlannerAPI = {
	// Trip Management API
	async getTrips(query?: TripsQuery): Promise<TripsListResponse> {
		const params = new URLSearchParams();
		if (query?.status) params.append("status", query.status);
		if (query?.limit) params.append("limit", query.limit.toString());
		if (query?.offset) params.append("offset", query.offset.toString());

		const queryString = params.toString();
		const endpoint = queryString ? `/trips?${queryString}` : "/trips";
		return fetchWithAuth(endpoint);
	},

	async getTrip(id: string): Promise<TripDetailResponse> {
		return fetchWithAuth(`/trips/${id}`);
	},

	async createTrip(data: CreateTripRequest): Promise<TripDetailResponse> {
		return fetchWithAuth("/trips", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	async updateTrip(id: string, data: UpdateTripRequest): Promise<TripDetailResponse> {
		return fetchWithAuth(`/trips/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	},

	async deleteTrip(id: string): Promise<{ success: true }> {
		return fetchWithAuth(`/trips/${id}`, {
			method: "DELETE",
		});
	},

	async toggleSharing(id: string, data: SharingToggleRequest): Promise<ShareTokenResponse> {
		return fetchWithAuth(`/trips/${id}/sharing`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	},

	// Itinerary Item API
	async getItineraryItems(tripId: string): Promise<ItineraryItemsResponse> {
		return fetchWithAuth(`/trips/${tripId}/itinerary`);
	},

	async createItineraryItem(
		tripId: string,
		data: CreateItineraryItemRequest,
	): Promise<ItineraryItemDetailResponse> {
		return fetchWithAuth(`/trips/${tripId}/itinerary`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	async updateItineraryItem(
		tripId: string,
		itemId: string,
		data: UpdateItineraryItemRequest,
	): Promise<ItineraryItemDetailResponse> {
		return fetchWithAuth(`/trips/${tripId}/itinerary/${itemId}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	},

	async deleteItineraryItem(tripId: string, itemId: string): Promise<{ success: true }> {
		return fetchWithAuth(`/trips/${tripId}/itinerary/${itemId}`, {
			method: "DELETE",
		});
	},

	async reorderItineraryItems(
		tripId: string,
		items: ItineraryReorderItem[],
	): Promise<ItineraryItemResponse[]> {
		return fetchWithAuth(`/trips/${tripId}/itinerary/reorder`, {
			method: "PATCH",
			body: JSON.stringify(items),
		});
	},

	// Image API
	async uploadItineraryImage(
		tripId: string,
		itineraryItemId: string,
		file: File,
		caption?: string,
	): Promise<ItineraryImage> {
		// Get token from Zustand auth store
		const authData = localStorage.getItem("auth-storage");
		let token = null;

		if (authData) {
			try {
				const parsed = JSON.parse(authData);
				token = parsed.state?.accessToken;
			} catch (_e) {
				// Invalid JSON in storage
			}
		}

		if (!token) {
			throw new ApiError(401, "No authentication token found");
		}

		const formData = new FormData();
		formData.append("image", file);
		if (caption) formData.append("caption", caption);

		const response = await fetch(
			`${API_BASE_URL}/api/v1/trip-planner/trips/${tripId}/itinerary/${itineraryItemId}/images`,
			{
				method: "POST",
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			let errorData: { error: string; details?: string; timestamp?: string };
			try {
				errorData = await response.json();
			} catch (_e) {
				errorData = { error: "Failed to parse error response" };
			}

			let errorMessage = errorData.error || "Upload failed";
			if (errorData.details) {
				errorMessage += ` - ${errorData.details}`;
			}

			throw new ApiError(response.status, errorMessage);
		}

		const data = await response.json();
		return data.image;
	},

	async deleteItineraryImage(
		tripId: string,
		itineraryItemId: string,
		imageId: string,
	): Promise<{ success: true }> {
		return fetchWithAuth(`/trips/${tripId}/itinerary/${itineraryItemId}/images/${imageId}`, {
			method: "DELETE",
		});
	},

	// Public sharing API (no auth required)
	async getPublicTrip(shareToken: string): Promise<PublicTripResponse> {
		const response = await fetch(
			`${API_BASE_URL}/api/v1/trip-planner/public/${shareToken}`,
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			let errorData: { error: string; details?: string };
			try {
				errorData = await response.json();
			} catch (_e) {
				errorData = { error: "Failed to parse error response" };
			}

			let errorMessage = errorData.error || "Request failed";
			if (errorData.details) {
				errorMessage += ` - ${errorData.details}`;
			}

			throw new ApiError(response.status, errorMessage);
		}

		return response.json();
	},
};

export { ApiError };