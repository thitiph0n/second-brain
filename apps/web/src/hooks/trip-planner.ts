// Placeholder hooks for trip planner functionality
export function useCreateTrip() {
	return {
		mutateAsync: async (data: any) => {
			console.log("Creating trip:", data);
			return { id: "trip-123", ...data };
		},
		isPending: false,
	};
}

export function useUpdateTrip() {
	return {
		mutateAsync: async ({ id, data }: { id: string; data: any }) => {
			console.log("Updating trip:", id, data);
			return { id, ...data };
		},
		isPending: false,
	};
}

export function useDeleteTrip() {
	return {
		mutateAsync: async (id: string) => {
			console.log("Deleting trip:", id);
			return { success: true };
		},
		isPending: false,
	};
}

export function useTrips() {
	return {
		data: {
			trips: [
				{
					id: "trip-123",
					name: "Summer Vacation",
					description: "A trip to the beach",
					startDate: "2024-07-01",
					endDate: "2024-07-07",
					isPublic: false,
					itinerary: [],
				},
			],
		},
		isLoading: false,
		isError: false,
	};
}

export function useTrip() {
	return {
		data: {
			id: "trip-123",
			name: "Summer Vacation",
			description: "A trip to the beach",
			startDate: "2024-07-01",
			endDate: "2024-07-07",
			isPublic: true, // Make it public to test public sharing badge too
			itinerary: [
				{
					id: "item-1",
					dayNumber: 1,
					order: 0,
					title: "Arrival",
					location: { city: "Miami" },
					isCompleted: false,
				}
			],
		},
		isLoading: false,
		isError: false,
	};
}

export function useCreateItineraryItem() {
	return {
		mutateAsync: async (data: any) => {
			console.log("Creating itinerary item:", data);
			return { id: "item-123", ...data };
		},
		isPending: false,
	};
}

export function useUpdateItineraryItem() {
	return {
		mutateAsync: async ({ id, data }: { id: string; data: any }) => {
			console.log("Updating itinerary item:", id, data);
			return { id, ...data };
		},
		isPending: false,
	};
}

export function useDeleteItineraryItem() {
	return {
		mutateAsync: async (id: string) => {
			console.log("Deleting itinerary item:", id);
			return { success: true };
		},
		isPending: false,
	};
}

export function useReorderItineraryItems() {
	return {
		mutateAsync: async ({ tripId, itemIds }: { tripId: string; itemIds: string[] }) => {
            const { tripPlannerAPI } = await import("../api/trip-planner");
            return tripPlannerAPI.reorderItineraryItems(tripId, itemIds);
		},
		isPending: false,
	};
}

export function useToggleItineraryItem() {
	return {
		mutateAsync: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
			console.log("Toggling itinerary item:", id, isCompleted);
			return { id, isCompleted };
		},
		isPending: false,
	};
}

export function useUploadItineraryImage() {
    return {
        mutateAsync: async ({ tripId, itemId, file, caption }: { tripId: string; itemId: string; file: File; caption?: string }) => {
            const { tripPlannerAPI } = await import("../api/trip-planner");
            return tripPlannerAPI.uploadItineraryImage(tripId, itemId, file, caption);
        },
        isPending: false,
    };
}

export function useDeleteItineraryImage() {
    return {
        mutateAsync: async ({ tripId, itemId, imageId }: { tripId: string; itemId: string; imageId: string }) => {
            const { tripPlannerAPI } = await import("../api/trip-planner");
            return tripPlannerAPI.deleteItineraryImage(tripId, itemId, imageId);
        },
        isPending: false,
    };
}

export function useItineraryItems() {
	return {
		data: {
			items: [] as any[],
		},
		isLoading: false,
		isError: false,
	};
}