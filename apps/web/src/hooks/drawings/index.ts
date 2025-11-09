// Core drawing hooks

// Export types for easier typing
export type {
	CreateDrawingButtonProps,
	Drawing,
	DrawingCardProps,
	DrawingFormData,
	DrawingFormDataWithContent,
	DrawingHeaderProps,
	DrawingListProps,
	DrawingType,
} from "@second-brain/types/drawing";
// Re-export React hooks that might be needed
export { useCallback, useEffect, useRef, useState } from "react";
// Export API client and error types
export { ApiError, drawingApi } from "@/services/drawingApi";
export { useCreateDrawing, useCreateDrawingDialog, useCreateDrawingForm } from "./useCreateDrawing";
export {
	useBulkDeleteDrawings,
	useDeleteDrawing,
	useDeleteDrawingDialog,
} from "./useDeleteDrawing";
export {
	DRAWING_QUERY_KEYS as DRAWING_SINGLE_QUERY_KEYS,
	useArchiveDrawing,
	useDrawing,
	usePrefetchDrawing,
	useUpdateDrawing,
} from "./useDrawing";
export {
	DRAWING_QUERY_KEYS,
	useArchivedDrawings,
	useDrawings,
	useDrawingsInfinite,
	useInvalidateDrawings,
	usePrefetchDrawings,
} from "./useDrawings";
export { useAutoSaveDrawing, useDrawingContent, useSaveDrawing } from "./useSaveDrawing";
export { useAssetUploadForm, useMultipleAssetUpload, useUploadAsset } from "./useUploadAsset";
