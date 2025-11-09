import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ApiError, drawingApi } from "@/services/drawingApi";

interface AssetUploadOptions {
	/**
	 * Whether to show upload progress
	 * @default true
	 */
	showProgress?: boolean;
	/**
	 * Maximum file size in bytes
	 * @default 10 * 1024 * 1024 (10MB)
	 */
	maxFileSize?: number;
	/**
	 * Allowed file types
	 * @default ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"]
	 */
	allowedTypes?: string[];
	/**
	 * Whether to validate file before upload
	 * @default true
	 */
	validateFile?: boolean;
	/**
	 * Callback when upload starts
	 */
	onUploadStart?: () => void;
	/**
	 * Callback when upload progress updates
	 */
	onProgress?: (progress: number) => void;
	/**
	 * Callback when upload is successful
	 */
	onSuccess?: (data: { url: string; key: string }) => void;
	/**
	 * Callback when upload fails
	 */
	onError?: (error: Error) => void;
	/**
	 * Callback when upload completes (success or error)
	 */
	onSettled?: () => void;
	/**
	 * Whether to automatically upload the file
	 * @default false
	 */
	autoUpload?: boolean;
	/**
	 * Custom upload function
	 */
	customUpload?: (file: File, type: "image" | "document") => Promise<{ url: string; key: string }>;
}

interface UploadStatus {
	status: "idle" | "validating" | "uploading" | "success" | "error";
	progress: number;
	error: Error | null;
}

interface FileValidationResult {
	isValid: boolean;
	errors: string[];
}

interface UseUploadAssetReturn {
	/**
	 * Upload a file
	 */
	upload: (file: File, type: "image" | "document") => Promise<void>;
	/**
	 * Upload a file (returns the actual response)
	 */
	uploadAsync: (file: File, type: "image" | "document") => Promise<{ url: string; key: string }>;
	/**
	 * Validate a file before upload
	 */
	validateFile: (file: File, type: "image" | "document") => FileValidationResult;
	/**
	 * Upload status
	 */
	uploadStatus: UploadStatus;
	/**
	 * Whether a file is currently being uploaded
	 */
	isUploading: boolean;
	/**
	 * Last upload error
	 */
	error: Error | null;
	/**
	 * Reset upload status
	 */
	reset: () => void;
	/**
	 * Pause upload (for future implementation)
	 */
	pause: () => void;
	/**
	 * Resume upload (for future implementation)
	 */
	resume: () => void;
}

/**
 * Hook to upload assets with progress tracking and validation
 */
export function useUploadAsset(options: AssetUploadOptions = {}): UseUploadAssetReturn {
	const {
		maxFileSize = 10 * 1024 * 1024,
		allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"],
		validateFile: shouldValidateFile = true,
		onUploadStart,
		onSuccess,
		onError,
		onSettled,
		customUpload,
	} = options;

	const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
		status: "idle",
		progress: 0,
		error: null,
	});

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async ({ file, type }: { file: File; type: "image" | "document" }) => {
			if (customUpload) {
				return customUpload(file, type);
			}
			return drawingApi.uploadAsset(file, type);
		},
		onMutate: async ({ file, type }) => {
			if (shouldValidateFile) {
				const validation = validateFileUpload(file, type);
				if (!validation.isValid) {
					throw new ApiError(400, validation.errors.join(", "));
				}
			}

			setUploadStatus({
				status: "uploading",
				progress: 0,
				error: null,
			});

			onUploadStart?.();
		},
		onSuccess: (data) => {
			setUploadStatus({
				status: "success",
				progress: 100,
				error: null,
			});

			onSuccess?.(data);
		},
		onError: (error: Error) => {
			setUploadStatus({
				status: "error",
				progress: 0,
				error,
			});

			onError?.(error);
		},
		onSettled: () => {
			onSettled?.();
		},
	});

	const validateFileUpload = (file: File, _type: "image" | "document"): FileValidationResult => {
		const errors: string[] = [];

		// Check file size
		if (file.size > maxFileSize) {
			errors.push(`File size exceeds maximum limit of ${Math.round(maxFileSize / 1024 / 1024)}MB`);
		}

		// Check file type
		if (!allowedTypes.includes(file.type)) {
			errors.push(
				`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
			);
		}

		// Check file name for invalid characters
		if (!file.name.match(/^[a-zA-Z0-9_\-\s.()]+$/)) {
			errors.push("File name contains invalid characters");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	};

	const upload = async (file: File, type: "image" | "document") => {
		try {
			await mutateAsync({ file, type });
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, "Failed to upload asset");
		}
	};

	const uploadAsync = async (file: File, type: "image" | "document") => {
		return mutateAsync({ file, type });
	};

	const reset = () => {
		setUploadStatus({
			status: "idle",
			progress: 0,
			error: null,
		});
	};

	const pause = () => {
		// TODO: Implement pause functionality
	};

	const resume = () => {
		// TODO: Implement resume functionality
	};

	return {
		upload,
		uploadAsync,
		validateFile: validateFileUpload,
		uploadStatus,
		isUploading: isPending,
		error: uploadStatus.error,
		reset,
		pause,
		resume,
	};
}

interface AssetUploadFormOptions extends Omit<AssetUploadOptions, "autoUpload"> {
	/**
	 * Whether to show file selection dialog
	 */
	showFileDialog?: boolean;
	/**
	 * Accepted file types
	 */
	accept?: string;
}

interface UseAssetUploadFormReturn {
	/**
	 * File input ref
	 */
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	/**
	 * Selected file
	 */
	selectedFile: File | null;
	/**
	 * Whether file is selected
	 */
	isFileSelected: boolean;
	/**
	 * Upload status
	 */
	uploadStatus: UploadStatus;
	/**
	 * Handle file selection
	 */
	handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
	/**
	 * Handle file drop
	 */
	handleFileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
	/**
	 * Handle file drag over
	 */
	handleFileDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
	/**
	 * Upload selected file
	 */
	uploadFile: (type: "image" | "document") => Promise<void>;
	/**
	 * Reset form
	 */
	resetForm: () => void;
	/**
	 * Whether the form is ready for upload
	 */
	canUpload: boolean;
}

/**
 * Hook to manage asset upload form with drag and drop support
 */
export function useAssetUploadForm(options: AssetUploadFormOptions = {}): UseAssetUploadFormReturn {
	const { showFileDialog: _showFileDialog = true, accept: _accept = "image/*,.pdf,.txt", ...uploadOptions } = options;
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const uploadAsset = useUploadAsset({
		...uploadOptions,
		validateFile: true,
	});

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const uploadFile = async (type: "image" | "document") => {
		if (selectedFile) {
			await uploadAsset.upload(selectedFile, type);
		}
	};

	const resetForm = () => {
		setSelectedFile(null);
		uploadAsset.reset();
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const canUpload = !!selectedFile && uploadAsset.uploadStatus.status !== "uploading";

	return {
		fileInputRef,
		selectedFile,
		isFileSelected: !!selectedFile,
		uploadStatus: uploadAsset.uploadStatus,
		handleFileSelect,
		handleFileDrop,
		handleFileDragOver,
		uploadFile,
		resetForm,
		canUpload: canUpload ?? false,
	};
}

interface MultipleAssetUploadOptions extends Omit<AssetUploadOptions, "autoUpload"> {
	/**
	 * Maximum number of files
	 * @default 10
	 */
	maxFiles?: number;
	/**
	 * Whether to show multiple file selection
	 */
	multiple?: boolean;
}

interface UseMultipleAssetUploadReturn {
	/**
	 * Upload multiple files
	 */
	uploadMultiple: (type: "image" | "document") => Promise<void>;
	/**
	 * Validate multiple files
	 */
	validateMultiple: (files: File[], type: "image" | "document") => FileValidationResult[];
	/**
	 * Queue of files to upload
	 */
	queue: File[];
	/**
	 * Current upload index
	 */
	currentUploadIndex: number;
	/**
	 * Upload status for each file
	 */
	uploadStatuses: UploadStatus[];
	/**
	 * Add files to queue
	 */
	addToQueue: (files: File[]) => void;
	/**
	 * Remove file from queue
	 */
	removeFromQueue: (index: number) => void;
	/**
	 * Clear queue
	 */
	clearQueue: () => void;
	/**
	 * Upload all queued files
	 */
	uploadQueue: (type: "image" | "document") => Promise<void>;
}

/**
 * Hook to manage multiple asset uploads with queue system
 */
export function useMultipleAssetUpload(
	options: MultipleAssetUploadOptions = {},
): UseMultipleAssetUploadReturn {
	const { maxFiles = 10, multiple = false, ...uploadOptions } = options;
	const [queue, setQueue] = useState<File[]>([]);
	const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
	const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

	const uploadAsset = useUploadAsset({
		...uploadOptions,
		onProgress: (progress) => {
			setUploadStatuses((prev) => {
				const newStatuses = [...prev];
				if (currentUploadIndex < newStatuses.length) {
					newStatuses[currentUploadIndex] = {
						...newStatuses[currentUploadIndex],
						progress,
					};
				}
				return newStatuses;
			});
			options.onProgress?.(progress);
		},
		onSuccess: (data) => {
			setUploadStatuses((prev) => {
				const newStatuses = [...prev];
				if (currentUploadIndex < newStatuses.length) {
					newStatuses[currentUploadIndex] = {
						status: "success",
						progress: 100,
						error: null,
					};
				}
				return newStatuses;
			});
			options.onSuccess?.(data);
		},
		onError: (error) => {
			setUploadStatuses((prev) => {
				const newStatuses = [...prev];
				if (currentUploadIndex < newStatuses.length) {
					newStatuses[currentUploadIndex] = {
						status: "error",
						progress: 0,
						error,
					};
				}
				return newStatuses;
			});
			options.onError?.(error);
		},
	});

	const validateMultiple = (files: File[], type: "image" | "document"): FileValidationResult[] => {
		return files.map((file) => uploadAsset.validateFile(file, type));
	};

	const addToQueue = (files: File[]) => {
		if (!multiple && files.length > 1) {
			throw new Error("Multiple files not allowed");
		}

		if (files.length + queue.length > maxFiles) {
			throw new Error(`Maximum ${maxFiles} files allowed`);
		}

		setQueue((prev) => [...prev, ...files]);
	};

	const removeFromQueue = (index: number) => {
		setQueue((prev) => prev.filter((_, i) => i !== index));
	};

	const clearQueue = () => {
		setQueue([]);
		setUploadStatuses([]);
		setCurrentUploadIndex(0);
	};

	const uploadQueueFiles = async (type: "image" | "document") => {
		for (let i = 0; i < queue.length; i++) {
			setCurrentUploadIndex(i);
			await uploadAsset.upload(queue[i], type);
		}
	};

	return {
		uploadMultiple: uploadQueueFiles,
		validateMultiple,
		queue,
		currentUploadIndex,
		uploadStatuses,
		addToQueue,
		removeFromQueue,
		clearQueue,
		uploadQueue: uploadQueueFiles,
	};
}
