// Placeholder API functions for trip planner

export const tripPlannerAPI = {
	// Trip API
	getTrips: async () => {
		console.log("Fetching trips");
		return { trips: [] };
	},

	getTrip: async (id: string) => {
		console.log("Fetching trip:", id);
		return { id, name: "Sample Trip" };
	},

	createTrip: async (data: any) => {
		console.log("Creating trip:", data);
		return { id: "trip-123", ...data };
	},

	updateTrip: async (id: string, data: any) => {
		console.log("Updating trip:", id, data);
		return { id, ...data };
	},

	deleteTrip: async (id: string) => {
		console.log("Deleting trip:", id);
		return { success: true };
	},

	// Itinerary Item API
	getItineraryItems: async (tripId: string) => {
		console.log("Fetching itinerary items for trip:", tripId);
		return { items: [] };
	},

	createItineraryItem: async (data: any) => {
		console.log("Creating itinerary item:", data);
		return { id: "item-123", ...data };
	},

	updateItineraryItem: async (id: string, data: any) => {
		console.log("Updating itinerary item:", id, data);
		return { id, ...data };
	},

	deleteItineraryItem: async (id: string) => {
		console.log("Deleting itinerary item:", id);
		return { success: true };
	},

	toggleItineraryItem: async (id: string, isCompleted: boolean) => {
		console.log("Toggling itinerary item:", id, isCompleted);
		return { id, isCompleted };
	},

	// Reorder API
	reorderItineraryItems: async (tripId: string, itemIds: string[]) => {
		const response = await fetch(`/api/v1/trip-planner/trips/${tripId}/itinerary/reorder`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ itemIds }),
		});

		if (!response.ok) {
			throw new Error("Failed to reorder items");
		}

        const data = await response.json();
		return data.itineraryItems;
	},

	// Image API
	// Image API
	uploadItineraryImage: async (tripId: string, itineraryItemId: string, file: File, caption?: string) => {
		const formData = new FormData();
		formData.append("file", file);
		if (caption) formData.append("caption", caption);

		const response = await fetch(`/api/v1/trip-planner/trips/${tripId}/itinerary/${itineraryItemId}/images`, {
			method: "POST",
            // headers: { "Authorization": ... } // Add auth header if needed, usually handled by checking cookie/token
			body: formData,
		});

		if (!response.ok) {
			throw new Error("Failed to upload image");
		}

		const data = await response.json();
		return data.image; // Expecting { image: { id, imageUrl, ... } }
	},

	deleteItineraryImage: async (tripId: string, itineraryItemId: string, imageId: string) => {
		const response = await fetch(`/api/v1/trip-planner/trips/${tripId}/itinerary/${itineraryItemId}/images/${imageId}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error("Failed to delete image");
		}

		return { success: true };
	},

	// Location API
	searchLocations: async (query: string) => {
		console.log("Searching locations:", query);
		return [];
	},

	// Sharing API
	shareTrip: async (id: string, isPublic: boolean) => {
		console.log("Sharing trip:", id, isPublic);
		return { success: true };
	},

	getSharedTrip: async (id: string) => {
		console.log("Fetching shared trip:", id);
		return { id, name: "Shared Trip" };
	},
};