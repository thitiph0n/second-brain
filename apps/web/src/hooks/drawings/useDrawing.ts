import type { Drawing } from "@second-brain/types/drawing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, drawingApi } from "@/services/drawingApi";

// Query keys for single drawing
export const DRAWING_QUERY_KEYS = {
	all: ["drawings"] as const,
	single: (id: string) => [...DRAWING_QUERY_KEYS.all, id] as const,
};

interface UseDrawingOptions {
	enabled?: boolean;
	staleTime?: number;
	refetchOnWindowFocus?: boolean;
	refetchOnMount?: boolean;
}

interface UseDrawingReturn {
	data: Drawing | null;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => void;
	isRefetching: boolean;
}

/**
 * Hook to fetch a single drawing by ID with optimistic updates support
 */
export function useDrawing(id: string, options: UseDrawingOptions = {}): UseDrawingReturn {
	const {
		enabled = true,
		staleTime = 1000 * 60 * 5,
		refetchOnWindowFocus = true,
		refetchOnMount = true,
	} = options;

	const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
		queryKey: DRAWING_QUERY_KEYS.single(id),
		queryFn: async () => {
			try {
				const response = await drawingApi.getDrawing(id);
				return response.drawing;
			} catch (error) {
				if (error instanceof ApiError) {
					throw error;
				}
				throw new ApiError(500, "Failed to fetch drawing");
			}
		},
		enabled: enabled && !!id,
		staleTime,
		refetchOnWindowFocus,
		refetchOnMount,
	});

	return {
		data: data || null,
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	};
}

interface OptimisticUpdateOptions {
	onSuccess?: (data: Drawing) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
}

interface UpdateDrawingMutationVariables {
	id: string;
	data: {
		title?: string;
		description?: string;
		isArchived?: boolean;
		parentId?: string;
	};
}

/**
 * Hook to update drawing metadata with optimistic updates
 */
export function useUpdateDrawing(_id?: string, options: OptimisticUpdateOptions = {}) {
	const queryClient = useQueryClient();

	const { onSuccess, onError, onSettled } = options;

	const mutation = useMutation({
		mutationFn: async ({ id: drawingId, data }: UpdateDrawingMutationVariables) => {
			if (!drawingId) {
				throw new ApiError(400, "Drawing ID is required");
			}
			const response = await drawingApi.updateDrawing(drawingId, data);
			return response.drawing;
		},
		onMutate: async ({ id: drawingId, data }: UpdateDrawingMutationVariables) => {
			if (!drawingId) return { previousDrawing: null };

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.single(drawingId),
			});

			// Snapshot the previous value
			const previousDrawing = queryClient.getQueryData<Drawing>(
				DRAWING_QUERY_KEYS.single(drawingId),
			);

			// Optimistically update the cache
			queryClient.setQueryData<Drawing>(DRAWING_QUERY_KEYS.single(drawingId), (oldDrawing) => {
				if (!oldDrawing) return undefined;
				return {
					...oldDrawing,
					...data,
					updatedAt: new Date().toISOString(),
				};
			});

			return { previousDrawing };
		},
		onSuccess: (newDrawing) => {
			// Update the drawings list cache
			queryClient.invalidateQueries({
				queryKey: ["drawings"],
			});

			onSuccess?.(newDrawing);
		},
		onError: (error: Error) => {
			onError?.(error);
		},
		onSettled: () => {
			onSettled?.();
		},
	});

	return {
		...mutation,
		updateDrawing: mutation.mutate,
		updateDrawingAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
		error: mutation.error,
	};
}

interface ArchiveDrawingOptions {
	onSuccess?: (data: Drawing) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
}

/**
 * Hook to archive/unarchive drawing with optimistic updates
 */
export function useArchiveDrawing(options: ArchiveDrawingOptions = {}) {
	const queryClient = useQueryClient();

	const { onSuccess, onError, onSettled } = options;

	const mutation = useMutation({
		mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
			const response = isArchived
				? await drawingApi.unarchiveDrawing(id)
				: await drawingApi.archiveDrawing(id);
			return response.drawing;
		},
		onMutate: async ({ id, isArchived }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.single(id),
			});

			// Snapshot the previous value
			const previousDrawing = queryClient.getQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id));

			// Optimistically update the cache
			queryClient.setQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id), (oldDrawing) => {
				if (!oldDrawing) return undefined;
				return {
					...oldDrawing,
					isArchived,
					updatedAt: new Date().toISOString(),
				};
			});

			return { previousDrawing };
		},
		onSuccess: (newDrawing) => {
			// Update the drawings list cache
			queryClient.invalidateQueries({
				queryKey: ["drawings"],
			});

			// Update the archived drawings list cache
			queryClient.invalidateQueries({
				queryKey: ["drawings", "archived"],
			});

			onSuccess?.(newDrawing);
		},
		onError: (error: Error) => {
			onError?.(error);
		},
		onSettled: () => {
			onSettled?.();
		},
	});

	return {
		...mutation,
		archiveDrawing: mutation.mutate,
		archiveDrawingAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
		error: mutation.error,
	};
}

/**
 * Hook to prefetch a single drawing for better performance
 */
export function usePrefetchDrawing() {
	const queryClient = useQueryClient();

	const prefetch = async (id: string) => {
		await queryClient.prefetchQuery({
			queryKey: DRAWING_QUERY_KEYS.single(id),
			queryFn: async () => {
				try {
					const response = await drawingApi.getDrawing(id);
					return response.drawing;
				} catch (error) {
					if (error instanceof ApiError) {
						throw error;
					}
					throw new ApiError(500, "Failed to fetch drawing");
				}
			},
			staleTime: 1000 * 60 * 5,
		});
	};

	return { prefetch };
}
