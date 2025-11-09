import type { Drawing } from "@second-brain/types/drawing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { ApiError, drawingApi } from "@/services/drawingApi";

// Query keys for cache management
export const DRAWING_QUERY_KEYS = {
	all: ["drawings"] as const,
	single: (id: string) => [...DRAWING_QUERY_KEYS.all, id] as const,
};

interface SaveDrawingOptions {
	/**
	 * Whether to enable auto-save functionality
	 * @default true
	 */
	enabled?: boolean;
	/**
	 * Auto-save interval in milliseconds
	 * @default 5000
	 */
	autoSaveInterval?: number;
	/**
	 * Debounce time for auto-save in milliseconds
	 * @default 1000
	 */
	debounceTime?: number;
	/**
	 * Maximum number of auto-save attempts
	 * @default 3
	 */
	maxRetries?: number;
	/**
	 * Whether to show save status
	 * @default true
	 */
	showSaveStatus?: boolean;
	/**
	 * Callback when saving starts
	 */
	onSaving?: () => void;
	/**
	 * Callback when save is successful
	 */
	onSaved?: (data: Drawing) => void;
	/**
	 * Callback when save fails
	 */
	onSaveError?: (error: Error) => void;
	/**
	 * Callback when save is retried
	 */
	onSaveRetry?: (retryCount: number, error: Error) => void;
}

interface AutoSaveOptions extends Omit<SaveDrawingOptions, "enabled"> {
	/**
	 * Whether to start auto-save immediately
	 * @default true
	 */
	immediate?: boolean;
}

interface UseSaveDrawingReturn {
	/**
	 * Manually save the drawing
	 */
	save: (content: string) => Promise<void>;
	/**
	 * Manually save the drawing (returns the actual response)
	 */
	saveAsync: (content: string) => Promise<Drawing>;
	/**
	 * Whether the drawing is currently being saved
	 */
	isSaving: boolean;
	/**
	 * Whether the drawing has been saved successfully
	 */
	isSaved: boolean;
	/**
	 * Last save error
	 */
	error: Error | null;
	/**
	 * Retry save operation
	 */
	retrySave: () => Promise<void>;
	/**
	 * Enable auto-save
	 */
	enableAutoSave: () => void;
	/**
	 * Disable auto-save
	 */
	disableAutoSave: () => void;
	/**
	 * Auto-save status
	 */
	autoSaveStatus: "idle" | "debouncing" | "saving" | "saved" | "error";
	/**
	 * Last saved timestamp
	 */
	lastSavedAt: Date | null;
	/**
	 * Number of auto-save retries
	 */
	retryCount: number;
}

/**
 * Hook to save drawing data with auto-save functionality and retry logic
 */
export function useSaveDrawing(id: string, options: SaveDrawingOptions = {}): UseSaveDrawingReturn {
	const queryClient = useQueryClient();
	const {
		enabled = true,
		autoSaveInterval = 5000,
		debounceTime = 1000,
		maxRetries = 3,
		onSaving,
		onSaved,
		onSaveError,
		onSaveRetry,
	} = options;

	const [isSaved, setIsSaved] = useState(false);
	const [autoSaveStatus, setAutoSaveStatus] = useState<
		"idle" | "debouncing" | "saving" | "saved" | "error"
	>("idle");
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [autoSaveEnabled, setAutoSaveEnabled] = useState(enabled);

	const [isMutationSaving, setMutationSaving] = useState(false);

	const {
		mutateAsync,
		error,
	} = useMutation({
		mutationFn: async (content: string) => {
			const response = await drawingApi.updateDrawing(id, { data: content });
			return response.drawing;
		},
		onMutate: async (content: string) => {
			await queryClient.cancelQueries({
				queryKey: DRAWING_QUERY_KEYS.single(id),
			});

			queryClient.setQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id), (oldDrawing) => {
				if (!oldDrawing) return oldDrawing;
				return {
					...oldDrawing,
					data: content,
					updatedAt: new Date().toISOString(),
				};
			});
		},
		onSuccess: (newDrawing) => {
			setIsSaved(true);
			setAutoSaveStatus("saved");
			setLastSavedAt(new Date());
			setRetryCount(0);

			queryClient.invalidateQueries({
				queryKey: ["drawings"],
			});

			onSaved?.(newDrawing);
		},
		onError: (error: Error) => {
			setAutoSaveStatus("error");
			onSaveError?.(error);
		},
		onSettled: () => {
			setMutationSaving(false);
		},
	});

	const saveAsync = useCallback(
		async (content: string) => {
			const response = await mutateAsync(content);
			return response;
		},
		[mutateAsync],
	);

	const save = useCallback(
		async (content: string) => {
			try {
				setMutationSaving(true);
				setAutoSaveStatus("saving");
				onSaving?.();
				await saveAsync(content);
			} catch (error) {
				if (error instanceof ApiError) {
					if (retryCount < maxRetries) {
						setRetryCount((prev) => prev + 1);
						onSaveRetry?.(retryCount + 1, error);
						setTimeout(() => {
							save(content);
						}, debounceTime);
					} else {
						onSaveError?.(error);
					}
				}
				throw error;
			} finally {
				setMutationSaving(false);
			}
		},
		[retryCount, maxRetries, onSaveRetry, onSaveError, debounceTime, onSaving, saveAsync],
	);

	const retrySave = async () => {
		if (retryCount < maxRetries) {
			try {
				setAutoSaveStatus("saving");
				const currentDrawing = queryClient.getQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id));
				if (currentDrawing?.data) {
					await save(currentDrawing.data);
				}
			} catch (_error) {
				// Error will be handled by the mutation
			}
		}
	};

	const enableAutoSave = () => {
		setAutoSaveEnabled(true);
	};

	const disableAutoSave = () => {
		setAutoSaveEnabled(false);
	};

	// Auto-save functionality
	useEffect(() => {
		if (!autoSaveEnabled) return;

		let timeoutId: NodeJS.Timeout;
		let intervalId: NodeJS.Timeout;

		const debouncedSave = (content: string) => {
			setAutoSaveStatus("debouncing");

			// Clear any existing timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// Set new timeout
			timeoutId = setTimeout(() => {
				save(content).catch(() => {
					// Error is handled by the mutation
				});
			}, debounceTime);
		};

		const handleAutoSave = () => {
			const currentDrawing = queryClient.getQueryData<Drawing>(DRAWING_QUERY_KEYS.single(id));
			if (currentDrawing?.data) {
				debouncedSave(currentDrawing.data);
			}
		};

		// Set up interval for auto-save
		intervalId = setInterval(handleAutoSave, autoSaveInterval);

		// Clean up
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [autoSaveEnabled, autoSaveInterval, debounceTime, id, queryClient.getQueryData, save]);

	return {
		save,
		saveAsync,
		isSaving: isMutationSaving,
		isSaved,
		error,
		retrySave,
		enableAutoSave,
		disableAutoSave,
		autoSaveStatus,
		lastSavedAt,
		retryCount,
	};
}

interface UseAutoSaveDrawingOptions extends Omit<AutoSaveOptions, "enabled"> {
	/**
	 * Drawing ID to save
	 */
	id: string;
}

interface UseAutoSaveDrawingReturn extends UseSaveDrawingReturn {
	/**
	 * Auto-save configuration
	 */
	config: AutoSaveOptions;
	/**
	 * Update auto-save configuration
	 */
	updateConfig: (config: Partial<AutoSaveOptions>) => void;
}

/**
 * Hook to manage auto-save functionality with configuration options
 */
export function useAutoSaveDrawing(options: UseAutoSaveDrawingOptions): UseAutoSaveDrawingReturn {
	const { id, ...saveOptions } = options;
	const saveDrawing = useSaveDrawing(id, saveOptions);

	const updateConfig = (config: Partial<AutoSaveOptions>) => {
		// This would require updating the underlying useSaveDrawing hook
		// For now, we'll just update the local state
		if (config.autoSaveInterval) {
			// Restart auto-save with new interval
			saveDrawing.disableAutoSave();
			saveDrawing.enableAutoSave();
		}
	};

	return {
		...saveDrawing,
		config: saveOptions,
		updateConfig,
	};
}

interface UseDrawingContentOptions extends Omit<SaveDrawingOptions, "enabled"> {
	/**
	 * Drawing ID
	 */
	id: string;
	/**
	 * Initial content
	 */
	initialContent: string;
}

interface UseDrawingContentReturn {
	/**
	 * Current content
	 */
	content: string;
	/**
	 * Update content
	 */
	updateContent: (content: string) => void;
	/**
	 * Whether content has unsaved changes
	 */
	hasUnsavedChanges: boolean;
	/**
	 * Whether content is being auto-saved
	 */
	isAutoSaving: boolean;
	/**
	 * Save content manually
	 */
	save: () => Promise<void>;
	/**
	 * Last saved timestamp
	 */
	lastSavedAt: Date | null;
	/**
	 * Auto-save status
	 */
	autoSaveStatus: "idle" | "debouncing" | "saving" | "saved" | "error";
}

/**
 * Hook to manage drawing content with auto-save functionality
 */
export function useDrawingContent(options: UseDrawingContentOptions): UseDrawingContentReturn {
	const { id, initialContent, ...saveOptions } = options;
	const [content, setContent] = useState(initialContent);
	const saveDrawing = useSaveDrawing(id, saveOptions);

	const updateContent = (newContent: string) => {
		setContent(newContent);
	};

	const hasUnsavedChanges = content !== initialContent;

	const save = async () => {
		await saveDrawing.save(content);
	};

	return {
		content,
		updateContent,
		hasUnsavedChanges,
		isAutoSaving: saveDrawing.isSaving && saveDrawing.autoSaveStatus === "saving",
		save,
		lastSavedAt: saveDrawing.lastSavedAt,
		autoSaveStatus: saveDrawing.autoSaveStatus,
	};
}
