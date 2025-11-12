import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useDrawing, useUpdateDrawing } from "@/hooks/drawings/useDrawing";
import { ExcalidrawCanvas } from "@/components/drawing/ExcalidrawCanvas";
import { Toolbar } from "./Toolbar";

interface DrawingPageProps {
	drawingId: string;
}

export function DrawingPage({ drawingId }: DrawingPageProps) {
	const navigate = useNavigate();

	const { data: drawing, isLoading, isError, error } = useDrawing(drawingId);
	const { updateDrawing } = useUpdateDrawing(drawingId);

	const [drawingName, setDrawingName] = useState("");
	const [hasChanges, setHasChanges] = useState(false);
	const excalidrawAPIRef = useRef<any>(null);

	const handleContentChanged = (changes: boolean) => {
		setHasChanges(changes);
	};

	const handleExcalidrawAPI = (api: any) => {
		excalidrawAPIRef.current = api;
	};

	// Add Cmd+S (Mac) and Ctrl+S (Windows) keyboard shortcuts for saving
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
			if ((event.metaKey || event.ctrlKey) && event.key === 's') {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				handleSave();
				return false;
			}
		};

		// Use capture phase to intercept before other handlers
		window.addEventListener('keydown', handleKeyDown, { capture: true });
		return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
	}, [drawing, drawingName, hasChanges]);

	// Prevent closing/refreshing window with unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (hasChanges) {
				// Standard way to show browser's confirmation dialog
				event.preventDefault();
				// Chrome requires returnValue to be set
				event.returnValue = '';
				// Some browsers might use the return value
				return '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasChanges]);

	// Set drawing name when data loads
	useEffect(() => {
		if (drawing) {
			setDrawingName(drawing.title);
		}
	}, [drawing]);

	const handleSave = async () => {
		if (!drawing) return;

		try {
			// Check if anything has actually changed
			const hasTitleChanged = drawingName !== drawing.title;
			const hasDescriptionChanged = false; // Description is not editable in current UI

			// If nothing changed, no need to save
			if (!hasTitleChanged && !hasDescriptionChanged && !hasChanges) {
				return;
			}

			// Prepare update data
			const updateData: any = {
				title: hasTitleChanged ? drawingName : undefined,
				description: hasDescriptionChanged ? drawing.description : undefined,
			};

			// Add content data if there are changes
			if (hasChanges && excalidrawAPIRef.current) {
				const elements = excalidrawAPIRef.current.getSceneElements();
				const appState = excalidrawAPIRef.current.getAppState();
				const files = excalidrawAPIRef.current.getFiles();
				const libraryItems = excalidrawAPIRef.current.getLibraryItems?.() || [];

				const content = {
					type: "excalidraw",
					version: 2,
					source: "https://excalidraw.com",
					elements,
					appState: {
						viewBackgroundColor: appState.viewBackgroundColor,
						gridSize: appState.gridSize,
					},
					files,
					libraryItems,
				};

				updateData.data = JSON.stringify(content);
			} else if (hasChanges) {
				// Fallback: use current drawing data if API not available
				updateData.data = drawing.data;
			}

			// Make single API call with all changes
			await updateDrawing({
				id: drawingId,
				data: updateData,
			});

			// Reset change state after successful save
			setHasChanges(false);
		} catch (error) {
			console.error("Failed to save drawing:", error);
		}
	};

	const handleSaveAs = async () => {
		if (!drawing) return;

		try {
			// Create a copy of the drawing with new name
			const response = await fetch(`/api/v1/drawings`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("auth-storage")}`,
				},
				body: JSON.stringify({
					title: `${drawingName} (Copy)`,
					data: drawing.data,
					description: drawing.description,
				}),
			});

			const newDrawing = await response.json();
			navigate({ to: `/drawings/$id`, params: { id: newDrawing.drawing.id } });
		} catch (error) {
			console.error("Failed to save drawing as:", error);
		}
	};

	const handleExit = () => {
		if (hasChanges) {
			const confirmExit = confirm("You have unsaved changes. Are you sure you want to exit?");
			if (!confirmExit) return;
		}
		navigate({ to: "/drawings" });
	};

	if (isLoading) {
		return (
			<div className="flex h-screen flex-col">
				<Toolbar
					drawingName="Loading..."
					onDrawingNameChange={() => {}}
					onSave={() => {}}
					onSaveAs={() => {}}
					onExit={() => {}}
					hasChanges={false}
				/>
				<div className="flex-1 bg-muted/50 flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
						<p className="text-sm text-muted-foreground">Loading drawing...</p>
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-screen flex-col">
				<Toolbar
					drawingName="Error"
					onDrawingNameChange={() => {}}
					onSave={() => {}}
					onSaveAs={() => {}}
					onExit={() => navigate({ to: "/drawings" })}
					hasChanges={false}
				/>
				<div className="flex-1 bg-muted/50 flex items-center justify-center">
					<div className="text-center">
						<h3 className="text-lg font-medium text-destructive mb-2">Error loading drawing</h3>
						<p className="text-sm text-muted-foreground mb-4">
							{error instanceof Error ? error.message : "Failed to load drawing"}
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	// If it's a folder, redirect back to drawings page
	if (drawing?.type === "folder") {
		navigate({ to: "/drawings" });
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 bg-background flex flex-col">
			<Toolbar
				drawingName={drawingName}
				onDrawingNameChange={setDrawingName}
				onSave={handleSave}
				onSaveAs={handleSaveAs}
				onExit={handleExit}
				hasChanges={hasChanges}
			/>
			<div className="flex-1 overflow-hidden">
				<ExcalidrawCanvas
					drawingId={drawingId}
					onContentChanged={handleContentChanged}
					onExcalidrawAPI={handleExcalidrawAPI}
				/>
			</div>
		</div>
	);
}
