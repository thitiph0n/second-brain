import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useState } from "react";
import { useDrawingCanvas } from "@/hooks/useDrawingCanvas";

interface ExcalidrawCanvasProps {
	drawingId: string;
	className?: string;
}

export function ExcalidrawCanvas({ drawingId, className }: ExcalidrawCanvasProps) {
	const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
	const { drawing, isLoading, isError, error, saveDrawing } = useDrawingCanvas(drawingId);
	const [initialData, setInitialData] = useState<{
		elements?: any[];
		appState?: any;
		files?: any;
	} | null>(null);

	useEffect(() => {
		if (drawing?.data) {
			try {
				const parsed = JSON.parse(drawing.data);
				setInitialData({
					elements: parsed.elements || [],
					appState: parsed.appState || {},
					files: parsed.files || {},
				});
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
		if (!excalidrawAPI) return;

		const handleChange = () => {
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
			};

			saveDrawing({ content: JSON.stringify(data) });
		};

		const interval = setInterval(handleChange, 30000);
		return () => clearInterval(interval);
	}, [excalidrawAPI, saveDrawing]);

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
				excalidrawAPI={(api) => setExcalidrawAPI(api)}
				initialData={initialData || undefined}
			/>
		</div>
	);
}
