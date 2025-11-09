import type { Drawing, DrawingFormDataWithContent } from "@second-brain/types/drawing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, drawingApi } from "@/services/drawingApi";

// Query keys for cache management
export const DRAWING_QUERY_KEYS = {
	all: ["drawings"] as const,
	lists: () => [...DRAWING_QUERY_KEYS.all, "list"] as const,
};

interface CreateDrawingOptions {
	onSuccess?: (data: Drawing) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
	/**
	 * Whether to automatically refetch the drawings list after creation
	 * @default true
	 */
	refetchList?: boolean;
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

interface UseCreateDrawingReturn {
	createDrawing: (data: DrawingFormDataWithContent) => void;
	createDrawingAsync: (data: DrawingFormDataWithContent) => Promise<Drawing>;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: Error | null;
	reset: () => void;
}

/**
 * Hook to create a new drawing with optimistic updates
 */
export function useCreateDrawing(options: CreateDrawingOptions = {}): UseCreateDrawingReturn {
	const queryClient = useQueryClient();
	const {
		onSuccess,
		onError,
		onSettled,
		refetchList = true,
		showSuccessToast = true,
		showErrorToast = true,
	} = options;

	const { mutate, mutateAsync, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: async (data: DrawingFormDataWithContent) => {
			const response = await drawingApi.createDrawing(data);
			return response.drawing;
		},
		onMutate: async (newDrawing: DrawingFormDataWithContent) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.lists(),
			});

			// Create optimistic drawing
			const optimisticDrawing: Drawing = {
				id: `optimistic-${Date.now()}`,
				title: newDrawing.title || "",
				description: newDrawing.description,
				data: newDrawing.content || newDrawing.data,
				type: "drawing" as const,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				userId: "current-user", // This should come from auth context
				isArchived: false,
			};

			// Optimistically add to the cache
			queryClient.setQueryData<Drawing[]>(DRAWING_QUERY_KEYS.lists(), (oldDrawings = []) => [
				optimisticDrawing,
				...oldDrawings,
			]);

			return { newDrawing, previousDrawings: queryClient.getQueryData(DRAWING_QUERY_KEYS.lists()) };
		},
		onSuccess: (newDrawing) => {
			// Update the drawings list cache with the real drawing
			queryClient.setQueryData<Drawing[]>(DRAWING_QUERY_KEYS.lists(), (oldDrawings = []) => {
				// Remove the optimistic drawing and add the real one
				return [newDrawing, ...oldDrawings.filter((d) => d.id !== `optimistic-${Date.now()}`)];
			});

			// Optionally refetch the drawings list
			if (refetchList) {
				queryClient.invalidateQueries({
					queryKey: DRAWING_QUERY_KEYS.lists(),
				});
			}

			// Show success toast if enabled
			if (showSuccessToast) {
				toast.success("Drawing created successfully");
			}

			onSuccess?.(newDrawing);
		},
		onError: (error: Error, _variables, context) => {
			// Rollback to previous value
			if (context?.previousDrawings) {
				queryClient.setQueryData(DRAWING_QUERY_KEYS.lists(), context.previousDrawings);
			}

			// Show error toast if enabled
			if (showErrorToast && error instanceof ApiError) {
				toast.error(`Failed to create drawing: ${error.message}`);
			}

			onError?.(error);
		},
		onSettled: () => {
			onSettled?.();
		},
	});

	return {
		createDrawing: mutate,
		createDrawingAsync: mutateAsync,
		isPending,
		isSuccess,
		isError,
		error,
		reset: () => {},
	};
}

interface CreateDrawingDialogOptions {
	onSuccess?: (data: Drawing) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
	refetchList?: boolean;
}

interface UseCreateDrawingDialogReturn {
	open: boolean;
	setOpen: (open: boolean) => void;
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: Error | null;
	handleCreate: (data: DrawingFormDataWithContent) => void;
	reset: () => void;
}

/**
 * Hook to create a drawing with dialog state management
 */
export function useCreateDrawingDialog(
	options: CreateDrawingDialogOptions = {},
): UseCreateDrawingDialogReturn {
	const [open, setOpen] = useState(false);
	const createMutation = useCreateDrawing({
		onSuccess: (data) => {
			options.onSuccess?.(data);
			setOpen(false);
		},
		onError: (error) => {
			options.onError?.(error);
		},
		onSettled: () => {
			options.onSettled?.();
		},
		refetchList: options.refetchList,
	});

	const handleCreate = (data: DrawingFormDataWithContent) => {
		createMutation.createDrawing(data);
	};

	const reset = () => {
		setOpen(false);
		createMutation.reset();
	};

	return {
		open,
		setOpen,
		isPending: createMutation.isPending,
		isSuccess: createMutation.isSuccess,
		isError: createMutation.isError,
		error: createMutation.error,
		handleCreate,
		reset,
	};
}

interface UseCreateDrawingFormOptions {
	defaultValues?: Partial<DrawingFormDataWithContent>;
	onSuccess?: (data: Drawing) => void;
	onError?: (error: Error) => void;
	onSettled?: () => void;
	refetchList?: boolean;
}

interface UseCreateDrawingFormReturn {
	values: DrawingFormDataWithContent;
	errors: Record<string, string>;
	isDirty: boolean;
	isSubmitting: boolean;
	handleInputChange: (field: keyof DrawingFormDataWithContent, value: string) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	reset: () => void;
}

/**
 * Hook to manage create drawing form state
 */
export function useCreateDrawingForm(
	options: UseCreateDrawingFormOptions = {},
): UseCreateDrawingFormReturn {
	const { defaultValues } = options;
	const [values, setValues] = useState<DrawingFormDataWithContent>({
		title: "",
		description: "",
		content: "",
		data: "",
		...defaultValues,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isDirty, setIsDirty] = useState(false);
	const createMutation = useCreateDrawing({
		onSuccess: (data) => {
			options.onSuccess?.(data);
		},
		onError: (error) => {
			options.onError?.(error);
		},
		onSettled: () => {
			options.onSettled?.();
		},
		refetchList: options.refetchList,
	});

	const handleInputChange = (field: keyof DrawingFormDataWithContent, value: string) => {
		setValues((prev) => ({
			...prev,
			[field]: value,
		}));
		if (!isDirty) setIsDirty(true);
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!values.title?.trim()) {
			newErrors.title = "Title is required";
		}

		if (!values.content?.trim() && !values.data?.trim()) {
			newErrors.content = "Content is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			await createMutation.createDrawingAsync(values);
		} catch (_error) {
			// Error is already handled by the mutation
		}
	};

	const reset = () => {
		setValues({
			title: "",
			description: "",
			content: "",
			data: "",
			...defaultValues,
		});
		setErrors({});
		setIsDirty(false);
		createMutation.reset();
	};

	return {
		values,
		errors,
		isDirty,
		isSubmitting: createMutation.isPending,
		handleInputChange,
		handleSubmit,
		reset,
	};
}
