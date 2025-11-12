import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, LibraryItems } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useState, useRef } from "react";
import { useDrawingCanvas } from "@/hooks/useDrawingCanvas";


interface ExcalidrawCanvasProps {
	drawingId: string;
	className?: string;
	onContentChanged?: (hasChanges: boolean) => void;
	onExcalidrawAPI?: (api: ExcalidrawImperativeAPI) => void;
}

export function ExcalidrawCanvas({ drawingId, className, onContentChanged, onExcalidrawAPI }: ExcalidrawCanvasProps) {
	const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
	const { drawing, isLoading, isError, error, saveDrawing } = useDrawingCanvas(drawingId);
	const [libraryItems, setLibraryItems] = useState<LibraryItems>([]);
	const [initialData, setInitialData] = useState<{
		elements?: readonly any[];
		appState?: any;
		files?: any;
		libraryItems?: LibraryItems;
	} | null>(null);
	const [lastSaveTime, setLastSaveTime] = useState<number>(0);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [changeType, setChangeType] = useState<string>('');
	const onContentChangedRef = useRef(onContentChanged);

	// Update ref when callback changes
	useEffect(() => {
		onContentChangedRef.current = onContentChanged;
	}, [onContentChanged]);

	// Handle library changes
	const onLibraryChange = (items: LibraryItems) => {
		setLibraryItems(items);
		// Update initialData to include new library items
		setInitialData(prev => prev ? { ...prev, libraryItems: items } : null);
	};

	
	// Simple but comprehensive element property comparison
	const deepCompareElements = (current: readonly any[], initial: any[]): boolean => {
		if (current.length !== initial.length) return false;

		for (let i = 0; i < current.length; i++) {
			const curr = current[i];
			const init = initial[i];

			// Basic property comparison
			if (curr.id !== init.id ||
				curr.x !== init.x ||
				curr.y !== init.y ||
				curr.width !== init.width ||
				curr.height !== init.height ||
				curr.strokeColor !== init.strokeColor ||
				curr.backgroundColor !== init.backgroundColor ||
				curr.fillStyle !== init.fillStyle ||
				curr.strokeWidth !== init.strokeWidth ||
				curr.strokeStyle !== init.strokeStyle ||
				curr.opacity !== init.opacity ||
				curr.angle !== init.angle) {
				return false;
			}

			// Text-specific comparison
			if (curr.type === 'text' && init.type === 'text') {
				const currentText = (curr as any).text || '';
				const initialText = (init as any).text || '';
				if (currentText !== initialText) return false;
				if ((curr as any).fontSize !== (init as any).fontSize) return false;
				if ((curr as any).fontFamily !== (init as any).fontFamily) return false;
			}
		}

		return true;
	};

	// Track changes by comparing current content with initial content
	const checkForChanges = () => {
		if (!excalidrawAPI || !initialData) {
			return false;
		}

		// Quick checks first before expensive operations
		const currentAppState = excalidrawAPI.getAppState();
		const backgroundChanged = currentAppState.viewBackgroundColor !== (initialData.appState?.viewBackgroundColor);
		const gridChanged = currentAppState.gridSize !== (initialData.appState?.gridSize);

		// Only do expensive element comparison if other things haven't changed
		if (backgroundChanged || gridChanged) {
			if (hasUnsavedChanges !== true) {
				setHasUnsavedChanges(true);
				if (onContentChanged) onContentChanged(true);
			}
			return true;
		}

		const currentElements = excalidrawAPI.getSceneElements();
		const elementCountChanged = currentElements.length !== (initialData.elements?.length || 0);

		if (elementCountChanged) {
			if (hasUnsavedChanges !== true) {
				setHasUnsavedChanges(true);
				if (onContentChanged) onContentChanged(true);
			}
			return true;
		}

		// Only do deep comparison if counts are the same
		if (initialData.elements && currentElements.length === initialData.elements.length) {
			const elementsChanged = !deepCompareElements(currentElements, [...initialData.elements]);
			if (elementsChanged !== hasUnsavedChanges) {
				setHasUnsavedChanges(elementsChanged);
				if (onContentChanged) onContentChanged(elementsChanged);
			}
			return elementsChanged;
		}

		// If we have elements but no initial data to compare against
		const hasChanges = currentElements.length > 0;
		if (hasChanges !== hasUnsavedChanges) {
			setHasUnsavedChanges(hasChanges);
			if (onContentChanged) onContentChanged(hasChanges);
		}
		return hasChanges;
	};

	const saveCurrentContent = () => {
		if (!excalidrawAPI) {
			console.error("No excalidrawAPI available for manual save");
			return;
		}
		const elements = [...excalidrawAPI.getSceneElements()];
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
			libraryItems: data.libraryItems,
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
					libraryItems: parsed.libraryItems || [],
				});

				// Also set library items state
				if (parsed.libraryItems) {
					setLibraryItems(parsed.libraryItems);
				}

				// Reset unsaved changes state when new data is loaded (e.g., after save)
				setHasUnsavedChanges(false);
				setChangeType('');
				setLastSaveTime(Date.now());
				if (onContentChanged) {
					onContentChanged(false);
				}

				// Immediately start change detection after a short delay to avoid race conditions
				setTimeout(() => {
					if (excalidrawAPI) {
						checkForChanges();
					}
				}, 200);
			} catch (err) {
				console.error("Failed to load drawing data:", err);
				setInitialData({
					elements: [],
					appState: {},
					files: {},
					libraryItems: [],
				});
			}
		} else {
			// Initialize with empty data for new drawings or when data is missing
			setInitialData({
				elements: [],
				appState: {},
				files: {},
				libraryItems: [],
			});
			setLibraryItems([]);
		}
	}, [drawing?.data, drawing?.id]);

	
	useEffect(() => {
		if (!excalidrawAPI || !initialData) {
			return;
		}

		const autoSave = () => {
			if (!excalidrawAPI || !initialData) {
				return;
			}

			// Use the improved change detection
			const hasChanges = checkForChanges();

			// Only save if there are changes and it's been at least 2 seconds since last save
			const now = Date.now();
			const timeSinceLastSave = now - lastSaveTime;

			if (hasChanges && timeSinceLastSave > 2000) {
				const currentElements = [...excalidrawAPI.getSceneElements()];
				const currentAppState = excalidrawAPI.getAppState();
				const currentFiles = excalidrawAPI.getFiles();

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

				// Update save time after successful save
				// Don't update initialData here - let the component sync with server data
				setLastSaveTime(now);
				setHasUnsavedChanges(false);
				setChangeType(''); // Reset change type after save
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

		// Check for changes more frequently but optimize the check itself
		const changeInterval = setInterval(checkChanges, 1000);

		return () => clearInterval(changeInterval);
	}, [excalidrawAPI, initialData, onContentChanged]);

	// Handle manual save requests from parent
	useEffect(() => {
		// Listen for manual save requests
		const handleManualSaveRequest = () => {
			saveCurrentContent();
		};

		// Listen for manual save completion (to reset state)
		const handleManualSaveComplete = () => {
			// Use immediate state update and notification
			setHasUnsavedChanges(false);
			setChangeType('');
			setLastSaveTime(Date.now());

			// Notify parent using ref to avoid stale closure
			setTimeout(() => {
				if (onContentChangedRef.current) {
					onContentChangedRef.current(false);
				}
			}, 0);
		};

		// Add event listeners for manual save
		window.addEventListener('manualSaveDrawing', handleManualSaveRequest as EventListener);
		window.addEventListener('manualSaveComplete', handleManualSaveComplete as EventListener);

		return () => {
			window.removeEventListener('manualSaveDrawing', handleManualSaveRequest as EventListener);
			window.removeEventListener('manualSaveComplete', handleManualSaveComplete as EventListener);
		};
	}, []); // Remove dependencies to prevent constant re-renders

	
	
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
			{process.env.NODE_ENV === 'development' && (
				<div style={{
					position: 'absolute',
					top: '50px',
					left: '10px',
					background: hasUnsavedChanges ? '#ff6b6b' : '#51cf66',
					color: 'white',
					padding: '8px 12px',
					borderRadius: '4px',
					fontSize: '11px',
					zIndex: 1000,
					fontFamily: 'monospace'
				}}>
					<div>Changes: {hasUnsavedChanges ? 'YES' : 'NO'}</div>
					{changeType && <div>Type: {changeType}</div>}
				</div>
			)}
			<Excalidraw
				excalidrawAPI={(api) => {
					console.log('ExcalidrawCanvas: Excalidraw API ready');
					setExcalidrawAPI(api);
					onExcalidrawAPI?.(api);
				}}
				initialData={initialData || undefined}
				onLibraryChange={onLibraryChange}
				onChange={() => {
					// Only check for changes when user stops drawing for a moment
					if (excalidrawAPI && initialData) {
						checkForChanges();
					}
				}}
				theme="light"
			/>
		</div>
	);
}
