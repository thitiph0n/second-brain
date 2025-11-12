import { Excalidraw, getDefaultAppState } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useState } from "react";
import { useDrawingCanvas } from "@/hooks/useDrawingCanvas";

interface ExcalidrawCanvasProps {
	drawingId: string;
	className?: string;
	onContentChanged?: (hasChanges: boolean) => void;
	onExcalidrawAPI?: (api: any) => void;
}

export function ExcalidrawCanvas({ drawingId, className, onContentChanged, onExcalidrawAPI }: ExcalidrawCanvasProps) {
	const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
	const { drawing, isLoading, isError, error, saveDrawing } = useDrawingCanvas(drawingId);
	const [libraryItems, setLibraryItems] = useState<any[]>([]);
	const [initialData, setInitialData] = useState<{
		elements?: any[];
		appState?: any;
		files?: any;
	} | null>(null);

	// Handle library changes
	const onLibraryChange = (items: any[]) => {
		setLibraryItems(items);
	};

	// Track changes by comparing current content with initial content
	const checkForChanges = () => {
		if (!excalidrawAPI || !initialData) return;

		const currentElements = excalidrawAPI.getSceneElements();
		const currentAppState = excalidrawAPI.getAppState();

		// Simple comparison - check if elements count changed
		const hasChanges =
			currentElements.length !== initialData.elements?.length ||
			JSON.stringify(currentElements) !== JSON.stringify(initialData.elements) ||
			currentAppState.viewBackgroundColor !== initialData.appState?.viewBackgroundColor;

		if (onContentChanged) {
			onContentChanged(hasChanges);
		}
	};

	const saveCurrentContent = () => {
		if (!excalidrawAPI) {
			console.error("No excalidrawAPI available for manual save");
			return;
		}
		const elements = excalidrawAPI.getSceneElements();
		const appState = excalidrawAPI.getAppState();
		const files = excalidrawAPI.getFiles();

		const data = {
			type: "excalidraw",
			version: 2,
			source: "https://excalidraw.com",
			elements,
			appState: {
				viewBackgroundColor: appState.viewBackgroundColor,
				gridSize: appState.gridSize,
			},
			files,
			libraryItems, // Include library items in saved data
		};

		saveDrawing({ content: JSON.stringify(data) });

		// Update initial data to current state after successful save
		setInitialData({
			elements: data.elements,
			appState: data.appState,
			files: data.files,
		});
	};

	useEffect(() => {
		if (drawing?.data) {
			try {
				const parsed = JSON.parse(drawing.data);
				setInitialData({
					elements: parsed.elements || [],
					appState: parsed.appState || {},
					files: parsed.files || {},
				});
				// Restore library items if they exist
				if (parsed.libraryItems) {
					setLibraryItems(parsed.libraryItems);
				}
			} catch (err) {
				console.error("Failed to load drawing data:", err);
				setInitialData({
					elements: [],
					appState: {},
					files: {},
				});
			}
		}
	}, [drawing?.data]);

	useEffect(() => {
		if (!excalidrawAPI || !initialData) return;

		const autoSave = () => {
			if (!excalidrawAPI || !initialData) return;

			// Get current content
			const currentElements = excalidrawAPI.getSceneElements();
			const currentAppState = excalidrawAPI.getAppState();
			const currentFiles = excalidrawAPI.getFiles();

			// Check if there are actual changes
			const hasChanges =
				currentElements.length !== initialData.elements?.length ||
				JSON.stringify(currentElements) !== JSON.stringify(initialData.elements) ||
				currentAppState.viewBackgroundColor !== initialData.appState?.viewBackgroundColor;

			// Only save if there are changes
			if (hasChanges) {
				const data = {
					type: "excalidraw",
					version: 2,
					source: "https://excalidraw.com",
					elements: currentElements,
					appState: {
						viewBackgroundColor: currentAppState.viewBackgroundColor,
						gridSize: currentAppState.gridSize,
					},
					files: currentFiles,
					libraryItems, // Include library items in auto-save
				};

				saveDrawing({ content: JSON.stringify(data) });

				// Update initial data after successful save
				setInitialData({
					elements: data.elements,
					appState: data.appState,
					files: data.files,
				});
			}
		};

		const interval = setInterval(autoSave, 5000); // Auto-save every 5 seconds (only if changed)

		return () => clearInterval(interval);
	}, [excalidrawAPI, saveDrawing, initialData, onContentChanged]);

	// Separate useEffect for change detection
	useEffect(() => {
		if (!excalidrawAPI || !initialData) return;

		const checkChanges = () => {
			checkForChanges();
		};

		// Check for changes more frequently when user interacts
		const changeInterval = setInterval(checkChanges, 2000);

		return () => clearInterval(changeInterval);
	}, [excalidrawAPI, initialData, onContentChanged]);

	// Handle manual save requests from parent
	useEffect(() => {
		// Listen for manual save requests
		const handleManualSaveRequest = () => {
			saveCurrentContent();
		};

		// Add event listener for manual save
		window.addEventListener('manualSaveDrawing', handleManualSaveRequest as EventListener);

		return () => {
			window.removeEventListener('manualSaveDrawing', handleManualSaveRequest as EventListener);
		};
	}, [excalidrawAPI]);

	if (isLoading) {
		return (
			<div className={`flex items-center justify-center w-full h-full bg-muted ${className}`}>
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-sm text-muted-foreground">Loading drawing...</p>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className={`flex items-center justify-center w-full h-full bg-muted ${className}`}>
				<div className="text-center">
					<h3 className="text-lg font-medium text-destructive mb-2">Error loading drawing</h3>
					<p className="text-sm text-muted-foreground">
						{error instanceof Error ? error.message : "Failed to load drawing"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`w-full h-full ${className}`}>
			<Excalidraw
				excalidrawAPI={(api) => {
					setExcalidrawAPI(api);
					onExcalidrawAPI?.(api);
				}}
				initialData={initialData || undefined}
				libraryItems={libraryItems}
				onLibraryChange={onLibraryChange}
				theme="light"
			/>
		</div>
	);
}
