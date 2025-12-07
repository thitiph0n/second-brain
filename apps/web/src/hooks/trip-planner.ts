// React Query hooks for trip planner data fetching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tripPlannerAPI } from "@/api/trip-planner";
import type {
	CreateTripRequest,
	UpdateTripRequest,
	TripsQuery,
	CreateItineraryItemRequest,
	UpdateItineraryItemRequest,
	ItineraryReorderItem,
	SharingToggleRequest,
} from "@/types/trip-planner";

// Trip Management Hooks

export function useTrips(query?: TripsQuery) {
	return useQuery({
		queryKey: ["trip-planner", "trips", query],
		queryFn: () => tripPlannerAPI.getTrips(query),
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

export function useTrip(tripId: string) {
	return useQuery({
		queryKey: ["trip-planner", "trip", tripId],
		queryFn: () => tripPlannerAPI.getTrip(tripId),
		staleTime: 1 * 60 * 1000, // 1 minute
		enabled: !!tripId,
	});
}

export function useCreateTrip() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateTripRequest) => tripPlannerAPI.createTrip(data),
		onSuccess: (newTrip) => {
			toast.success("Trip created successfully!");
			// Invalidate trips list
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trips"] });
			// Set the new trip in cache
			queryClient.setQueryData(["trip-planner", "trip", newTrip.id], newTrip);
		},
		onError: (error) => {
			toast.error(
				`Failed to create trip: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useUpdateTrip() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateTripRequest }) =>
			tripPlannerAPI.updateTrip(id, data),
		onSuccess: (updatedTrip) => {
			toast.success("Trip updated successfully!");
			// Update the trip in cache
			queryClient.setQueryData(["trip-planner", "trip", updatedTrip.id], updatedTrip);
			// Invalidate trips list to reflect changes
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trips"] });
		},
		onError: (error) => {
			toast.error(
				`Failed to update trip: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useDeleteTrip() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tripId: string) => tripPlannerAPI.deleteTrip(tripId),
		onSuccess: (_, tripId) => {
			toast.success("Trip deleted successfully!");
			// Remove from cache
			queryClient.removeQueries({ queryKey: ["trip-planner", "trip", tripId] });
			// Invalidate trips list
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trips"] });
		},
		onError: (error) => {
			toast.error(
				`Failed to delete trip: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useToggleSharing() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ tripId, data }: { tripId: string; data: SharingToggleRequest }) =>
			tripPlannerAPI.toggleSharing(tripId, data),
		onSuccess: (_, { tripId }) => {
			toast.success("Sharing settings updated!");
			// Invalidate the trip to refresh sharing status
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trips"] });
		},
		onError: (error) => {
			toast.error(
				`Failed to update sharing: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

// Itinerary Management Hooks

export function useItineraryItems(tripId: string) {
	return useQuery({
		queryKey: ["trip-planner", "itinerary", tripId],
		queryFn: () => tripPlannerAPI.getItineraryItems(tripId),
		staleTime: 1 * 60 * 1000, // 1 minute
		enabled: !!tripId,
	});
}

export function useCreateItineraryItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ tripId, data }: { tripId: string; data: CreateItineraryItemRequest }) =>
			tripPlannerAPI.createItineraryItem(tripId, data),
		onSuccess: (_, { tripId }) => {
			toast.success("Itinerary item added!");
			// Invalidate itinerary items
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "itinerary", tripId] });
			// Invalidate the trip to refresh itinerary count
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
		},
		onError: (error) => {
			toast.error(
				`Failed to add itinerary item: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useUpdateItineraryItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tripId,
			itemId,
			data,
		}: {
			tripId: string;
			itemId: string;
			data: UpdateItineraryItemRequest;
		}) => tripPlannerAPI.updateItineraryItem(tripId, itemId, data),
		onSuccess: (_, { tripId }) => {
			toast.success("Itinerary item updated!");
			// Invalidate itinerary items
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "itinerary", tripId] });
			// Invalidate the trip to reflect changes
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
		},
		onError: (error) => {
			toast.error(
				`Failed to update itinerary item: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useDeleteItineraryItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ tripId, itemId }: { tripId: string; itemId: string }) =>
			tripPlannerAPI.deleteItineraryItem(tripId, itemId),
		onSuccess: (_, { tripId }) => {
			toast.success("Itinerary item deleted!");
			// Invalidate itinerary items
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "itinerary", tripId] });
			// Invalidate the trip to refresh itinerary count
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
		},
		onError: (error) => {
			toast.error(
				`Failed to delete itinerary item: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useReorderItineraryItems() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ tripId, items }: { tripId: string; items: ItineraryReorderItem[] }) =>
			tripPlannerAPI.reorderItineraryItems(tripId, items),
		onSuccess: (_, { tripId }) => {
			// Invalidate to refetch with new order
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "itinerary", tripId] });
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
		},
		onError: (error) => {
			toast.error(
				`Failed to reorder items: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

// Image Management Hooks

export function useUploadItineraryImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tripId,
			itemId,
			file,
			caption,
		}: {
			tripId: string;
			itemId: string;
			file: File;
			caption?: string;
		}) => tripPlannerAPI.uploadItineraryImage(tripId, itemId, file, caption),
		onSuccess: (_, { tripId }) => {
			toast.success("Image uploaded successfully!");
			// Invalidate itinerary items to show new image
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "itinerary", tripId] });
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
		},
		onError: (error) => {
			toast.error(
				`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

export function useDeleteItineraryImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tripId,
			itemId,
			imageId,
		}: {
			tripId: string;
			itemId: string;
			imageId: string;
		}) => tripPlannerAPI.deleteItineraryImage(tripId, itemId, imageId),
		onSuccess: (_, { tripId }) => {
			toast.success("Image deleted successfully!");
			// Invalidate itinerary items to remove image
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "itinerary", tripId] });
			queryClient.invalidateQueries({ queryKey: ["trip-planner", "trip", tripId] });
		},
		onError: (error) => {
			toast.error(
				`Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		},
	});
}

// Public Sharing Hook (no auth required)

export function usePublicTrip(shareToken: string) {
	return useQuery({
		queryKey: ["trip-planner", "public", shareToken],
		queryFn: () => tripPlannerAPI.getPublicTrip(shareToken),
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: !!shareToken,
		retry: false, // Don't retry on 404
	});
}