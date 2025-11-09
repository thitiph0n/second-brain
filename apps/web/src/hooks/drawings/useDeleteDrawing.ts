import type { Drawing } from "@second-brain/types/drawing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, drawingApi } from "@/services/drawingApi";

// Query keys for cache management
export const DRAWING_QUERY_KEYS = {
	all: ["drawings"] as const,
	lists: () => [...DRAWING_QUERY_KEYS.all, "list"] as const,
	single: (id: string) => [...DRAWING_QUERY_KEYS.all, id] as const,
};

interface DeleteDrawingOptions {
	/**
	 * Whether to show confirmation dialog
	 * @default true
	 */
	showConfirmation?: boolean;
	/**
	 * Confirmation message to display
	 * @default "Are you sure you want to delete this drawing?"
	 */
	confirmationMessage?: string;
	/**
	 * Callback to confirm deletion
	 * @default "Delete"
	 */
	confirmButtonText?: string;
	/**
	 * Callback to cancel deletion
	 * @default "Cancel"
	 */
	cancelButtonText?: string;
	/**
	 * Whether to automatically refetch the drawings list after deletion
	 * @default true
	 */
	refetchList?: boolean;
	/**
	 * Custom confirmation function
	 */
	confirm?: () => Promise<boolean>;
	onSuccess?: (data: { message: string }) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
	/**
	 * Whether to show toast notification on success
	 * @default true
	 */
	showSuccessToast?: boolean;
	/**
	 * Whether to show toast notification on error
	 * @default true
	 */
	showErrorToast?: boolean;
}

interface UseDeleteDrawingReturn {
	deleteDrawing: (id: string) => void;
	deleteDrawingAsync: (id: string) => Promise<{ message: string }>;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: Error | null;
	reset: () => void;
}

/**
 * Hook to delete a drawing with confirmation and optimistic updates
 */
export function useDeleteDrawing(options: DeleteDrawingOptions = {}): UseDeleteDrawingReturn {
	const queryClient = useQueryClient();
	const {
		showConfirmation = true,
		confirmationMessage = "Are you sure you want to delete this drawing?",
		refetchList = true,
		onSuccess,
		onError,
		onSettled,
		showSuccessToast = true,
		showErrorToast = true,
		confirm,
	} = options;

	const { mutate, mutateAsync, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: async (id: string) => {
			const response = await drawingApi.deleteDrawing(id);
			return response;
		},
		onMutate: async (id: string) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.lists(),
			});
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.single(id),
			});

			// Snapshot the previous value
			const previousDrawings = queryClient.getQueryData<Drawing[]>(DRAWING_QUERY_KEYS.lists());
			const previousDrawing = queryClient.getQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id));

			// Optimistically remove from the cache
			queryClient.setQueryData<Drawing[]>(DRAWING_QUERY_KEYS.lists(), (oldDrawings = []) =>
				oldDrawings.filter((drawing) => drawing.id !== id),
			);

			queryClient.setQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id), undefined);

			return { previousDrawings, previousDrawing };
		},
		onSuccess: (data) => {
			// Optionally refetch the drawings list
			if (refetchList) {
				queryClient.invalidateQueries({
					queryKey: DRAWING_QUERY_KEYS.lists(),
				});
			}

			// Show success toast if enabled
			if (showSuccessToast) {
				toast.success("Drawing deleted successfully");
			}

			onSuccess?.(data);
		},
		onError: (error: Error, _variables, context) => {
			// Rollback to previous value
			if (context?.previousDrawings) {
				queryClient.setQueryData(DRAWING_QUERY_KEYS.lists(), context.previousDrawings);
				queryClient.setQueryData(DRAWING_QUERY_KEYS.single(_variables), context.previousDrawing);
			}

			// Show error toast if enabled
			if (showErrorToast && error instanceof ApiError) {
				toast.error(`Failed to delete drawing: ${error.message}`);
			}

			onError?.(error);
		},
		onSettled: () => {
			onSettled?.();
		},
	});

	const deleteDrawingWithConfirmation = async (id: string) => {
		if (showConfirmation) {
			if (confirm) {
				const confirmed = await confirm();
				if (!confirmed) return;
			} else {
				// Use window.confirm for basic confirmation
				const confirmed = window.confirm(confirmationMessage);
				if (!confirmed) return;
			}
		}
		mutate(id);
	};

	return {
		deleteDrawing: deleteDrawingWithConfirmation,
		deleteDrawingAsync: mutateAsync,
		isPending,
		isSuccess,
		isError,
		error,
		reset: () => {},
	};
}

interface DeleteDrawingDialogOptions {
	onSuccess?: (data: { message: string }) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
	refetchList?: boolean;
}

interface UseDeleteDrawingDialogReturn {
	open: boolean;
	setOpen: (open: boolean) => void;
	selectedDrawingId: string | null;
	setSelectedDrawingId: (id: string | null) => void;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: Error | null;
	handleDelete: (id: string) => void;
	reset: () => void;
}

/**
 * Hook to delete a drawing with dialog state management
 */
export function useDeleteDrawingDialog(
	options: DeleteDrawingDialogOptions = {},
): UseDeleteDrawingDialogReturn {
	const [open, setOpen] = useState(false);
	const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
	const deleteMutation = useDeleteDrawing({
		showConfirmation: false, // Dialog provides confirmation
		onSuccess: (data) => {
			options.onSuccess?.(data);
			setOpen(false);
			setSelectedDrawingId(null);
		},
		onError: (error) => {
			options.onError?.(error);
		},
		onSettled: () => {
			options.onSettled?.();
		},
		refetchList: options.refetchList,
	});

	const handleDelete = (id: string) => {
		setSelectedDrawingId(id);
		setOpen(true);
	};

	const reset = () => {
		setOpen(false);
		setSelectedDrawingId(null);
		deleteMutation.reset();
	};

	return {
		open,
		setOpen,
		selectedDrawingId,
		setSelectedDrawingId,
		isPending: deleteMutation.isPending,
		isSuccess: deleteMutation.isSuccess,
		isError: deleteMutation.isError,
		error: deleteMutation.error,
		handleDelete,
		reset,
	};
}

interface BulkDeleteDrawingsOptions {
	/**
	 * Whether to show confirmation dialog
	 * @default true
	 */
	showConfirmation?: boolean;
	/**
	 * Confirmation message to display
	 * @default `Are you sure you want to delete ${count} drawing(s)?`
	 */
	confirmationMessage?: (count: number) => string;
	onSuccess?: (data: { message: string; deletedCount: number; requestedCount: number }) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
	/**
	 * Whether to show toast notification on success
	 * @default true
	 */
	showSuccessToast?: boolean;
	/**
	 * Whether to show toast notification on error
	 * @default true
	 */
	showErrorToast?: boolean;
}

interface UseBulkDeleteDrawingsReturn {
	bulkDelete: (ids: string[]) => void;
	bulkDeleteAsync: (
		ids: string[],
	) => Promise<{ message: string; deletedCount: number; requestedCount: number }>;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: Error | null;
}

/**
 * Hook to bulk delete multiple drawings
 */
export function useBulkDeleteDrawings(
	options: BulkDeleteDrawingsOptions = {},
): UseBulkDeleteDrawingsReturn {
	const queryClient = useQueryClient();
	const {
		showConfirmation = true,
		confirmationMessage = (count) => `Are you sure you want to delete ${count} drawing(s)?`,
		onSuccess,
		onError,
		onSettled,
		showSuccessToast = true,
		showErrorToast = true,
	} = options;

	const { mutate, mutateAsync, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: async (ids: string[]) => {
			// Note: This would need to be implemented in the API
			// For now, we'll delete one by one
			await Promise.all(
				ids.map(async (id) => {
					const response = await drawingApi.deleteDrawing(id);
					return response;
				}),
			);
			return {
				message: `Successfully deleted ${ids.length} drawing(s)`,
				deletedCount: ids.length,
				requestedCount: ids.length,
			};
		},
		onMutate: async (ids: string[]) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.lists(),
			});

			// Snapshot the previous value
			const previousDrawings = queryClient.getQueryData<Drawing[]>(DRAWING_QUERY_KEYS.lists());

			// Optimistically remove from the cache
			queryClient.setQueryData<Drawing[]>(DRAWING_QUERY_KEYS.lists(), (oldDrawings = []) =>
				oldDrawings.filter((drawing) => !ids.includes(drawing.id)),
			);

			return { previousDrawings };
		},
		onSuccess: (data) => {
			// Show success toast if enabled
			if (showSuccessToast) {
				toast.success(`Deleted ${data.deletedCount} drawing(s)`);
			}

			onSuccess?.(data);
		},
		onError: (error: Error) => {
			// Show error toast if enabled
			if (showErrorToast && error instanceof ApiError) {
				toast.error(`Failed to delete drawings: ${error.message}`);
			}

			onError?.(error);
		},
		onSettled: () => {
			onSettled?.();
		},
	});

	const bulkDeleteWithConfirmation = async (ids: string[]) => {
		if (showConfirmation) {
			const confirmed = window.confirm(confirmationMessage(ids.length));
			if (!confirmed) return;
		}
		mutate(ids);
	};

	return {
		bulkDelete: bulkDeleteWithConfirmation,
		bulkDeleteAsync: mutateAsync,
		isPending,
		isSuccess,
		isError,
		error,
	};
}
