import type { Drawing } from "@second-brain/types/drawing";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, drawingApi } from "@/services/drawingApi";

// Query keys for cache management
export const DRAWING_QUERY_KEYS = {
	all: ["drawings"] as const,
	lists: () => [...DRAWING_QUERY_KEYS.all, "list"] as const,
	list: (filters?: string) => [...DRAWING_QUERY_KEYS.lists(), { filters }] as const,
	archived: () => [...DRAWING_QUERY_KEYS.all, "archived"] as const,
	search: () => [...DRAWING_QUERY_KEYS.all, "search"] as const,
};

// Options for query configuration
export const DRAWING_QUERY_OPTIONS = {
	staleTime: 1000 * 60 * 5, // 5 minutes
	refetchOnWindowFocus: true,
	refetchOnMount: true,
	refetchInterval: false,
};

interface UseDrawingsOptions {
	filters?: {
		isArchived?: boolean;
		searchQuery?: string;
	};
	enabled?: boolean;
	staleTime?: number;
	refetchInterval?: number | false;
}

interface UseDrawingsReturn {
	data: Drawing[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => void;
	isRefetching: boolean;
}

/**
 * Hook to fetch all drawings for the authenticated user
 * with caching and invalidation support
 */
export function useDrawings(options: UseDrawingsOptions = {}): UseDrawingsReturn {
	const {
		filters,
		enabled = true,
		staleTime = DRAWING_QUERY_OPTIONS.staleTime,
		refetchInterval = DRAWING_QUERY_OPTIONS.refetchInterval,
	} = options;

	const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<Drawing[]>({
		queryKey: DRAWING_QUERY_KEYS.list(filters ? JSON.stringify(filters) : undefined),
		queryFn: async () => {
			try {
				const response = await drawingApi.getDrawings();
				return response.drawings;
			} catch (error) {
				if (error instanceof ApiError) {
					throw error;
				}
				throw new ApiError(500, "Failed to fetch drawings");
			}
		},
		enabled,
		staleTime,
		refetchInterval: typeof refetchInterval === 'boolean' ? undefined : refetchInterval,
	});

	return {
		data: data || [],
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	};
}

interface UseDrawingsInfiniteOptions {
	enabled?: boolean;
	staleTime?: number;
}

interface UseDrawingsInfiniteReturn {
	data: Drawing[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	hasMore: boolean;
	fetchNextPage: () => void;
	isFetchingNextPage: boolean;
}

/**
 * Hook for infinite scroll of drawings (for future pagination support)
 */
export function useDrawingsInfinite(
	options: UseDrawingsInfiniteOptions = {},
): UseDrawingsInfiniteReturn {
	const { enabled = true, staleTime = DRAWING_QUERY_OPTIONS.staleTime } = options;

	const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage, hasNextPage } =
		useInfiniteQuery({
			queryKey: DRAWING_QUERY_KEYS.lists(),
			initialPageParam: 0,
			queryFn: async ({ pageParam = 0 }) => {
				try {
					// TODO: Add pagination to API endpoint
					const response = await drawingApi.getDrawings();
					return {
						drawings: response.drawings,
						hasMore: false, // TODO: Implement pagination
						nextPage: pageParam + 1,
					};
				} catch (error) {
					if (error instanceof ApiError) {
						throw error;
					}
					throw new ApiError(500, "Failed to fetch drawings");
				}
			},
			getNextPageParam: (lastPage) => lastPage?.nextPage,
			enabled,
			staleTime,
		});

	return {
		data: data?.pages.flatMap((page) => page.drawings) || [],
		isLoading,
		isError,
		error,
		hasMore: hasNextPage || false,
		fetchNextPage,
		isFetchingNextPage,
	};
}

interface UseArchivedDrawingsOptions {
	enabled?: boolean;
	staleTime?: number;
}

interface UseArchivedDrawingsReturn {
	data: Drawing[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => void;
	isRefetching: boolean;
}

/**
 * Hook to fetch only archived drawings
 */
export function useArchivedDrawings(
	options: UseArchivedDrawingsOptions = {},
): UseArchivedDrawingsReturn {
	const { enabled = true, staleTime = DRAWING_QUERY_OPTIONS.staleTime } = options;

	const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
		queryKey: DRAWING_QUERY_KEYS.archived(),
		queryFn: async () => {
			try {
				const response = await drawingApi.getDrawings();
				return response.drawings.filter((drawing) => drawing.isArchived);
			} catch (error) {
				if (error instanceof ApiError) {
					throw error;
				}
				throw new ApiError(500, "Failed to fetch archived drawings");
			}
		},
		enabled,
		staleTime,
	});

	return {
		data: data || [],
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	};
}

/**
 * Hook to prefetch drawings for better performance
 */
export function usePrefetchDrawings() {
	const queryClient = useQueryClient();

	const prefetch = async (filters?: string) => {
		await queryClient.prefetchQuery({
			queryKey: DRAWING_QUERY_KEYS.list(filters),
			queryFn: async () => {
				try {
					const response = await drawingApi.getDrawings();
					return response.drawings;
				} catch (error) {
					if (error instanceof ApiError) {
						throw error;
					}
					throw new ApiError(500, "Failed to fetch drawings");
				}
			},
			staleTime: DRAWING_QUERY_OPTIONS.staleTime,
		});
	};

	return { prefetch };
}

/**
 * Hook to invalidate drawings cache
 */
export function useInvalidateDrawings() {
	const queryClient = useQueryClient();

	const invalidate = async (filters?: string) => {
		await queryClient.invalidateQueries({
			queryKey: DRAWING_QUERY_KEYS.list(filters),
		});
	};

	const invalidateArchived = async () => {
		await queryClient.invalidateQueries({
			queryKey: DRAWING_QUERY_KEYS.archived(),
		});
	};

	const invalidateAll = async () => {
		await queryClient.invalidateQueries({
			queryKey: DRAWING_QUERY_KEYS.all,
		});
	};

	return { invalidate, invalidateArchived, invalidateAll };
}
