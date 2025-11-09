import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDrawingCanvas } from "@/hooks/useDrawingCanvas";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";

interface ResponsiveDrawingCanvasProps {
	drawingId: string;
	onExit?: () => void;
	className?: string;
}

export function ResponsiveDrawingCanvas({
	drawingId,
	onExit,
	className,
}: ResponsiveDrawingCanvasProps) {
	const { drawing, isLoading, isError, error, updateDrawing, isUpdating } =
		useDrawingCanvas(drawingId);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	// Initialize form data
	useEffect(() => {
		if (drawing) {
			setTitle(drawing.title);
			setDescription(drawing.description || "");
		}
	}, [drawing]);

	// Handle title/description updates
	const handleUpdate = async () => {
		if (!drawing) return;

		try {
			await updateDrawing({ title, description: description || undefined });
			toast.success("Drawing updated successfully");
		} catch (_error) {
			toast.error("Failed to update drawing");
		}
	};

	// Handle fullscreen toggle
	const toggleFullscreen = useCallback(() => {
		if (!isFullscreen) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
		setIsFullscreen(!isFullscreen);
	}, [isFullscreen]);

	// Handle escape key
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isFullscreen) {
				toggleFullscreen();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isFullscreen, toggleFullscreen]);

	if (isLoading) {
		return (
			<div
				className={`w-full h-full bg-muted rounded-lg flex items-center justify-center ${className}`}
			>
				<div className="animate-pulse space-y-4">
					<div className="h-32 bg-gray-200 rounded dark:bg-gray-700"></div>
					<div className="space-y-2">
						<div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4"></div>
						<div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-1/2"></div>
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div
				className={`w-full h-full bg-muted rounded-lg flex items-center justify-center ${className}`}
			>
				<div className="text-center space-y-2 text-destructive">
					<div className="text-2xl">⚠️</div>
					<p>Failed to load drawing</p>
					<p className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</p>
				</div>
			</div>
		);
	}

	if (!drawing) {
		return (
			<div
				className={`w-full h-full bg-muted rounded-lg flex items-center justify-center ${className}`}
			>
				<div className="text-center space-y-2 text-muted-foreground">
					<div className="text-2xl">🎨</div>
					<p>Drawing Canvas</p>
					<p className="text-sm">No drawing data available</p>
				</div>
			</div>
		);
	}

	const containerClasses = isFullscreen
		? "fixed inset-0 z-50 bg-background"
		: `w-full h-full flex flex-col ${className}`;

	return (
		<div className={containerClasses}>
			{/* Header with controls */}
			<div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex items-center justify-between p-4">
					<div className="flex items-center gap-4 flex-1">
						{onExit && (
							<Button variant="outline" size="sm" onClick={onExit}>
								← Back
							</Button>
						)}

						<div className="flex items-center gap-2">
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								onBlur={handleUpdate}
								onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
								placeholder="Drawing title..."
								className="w-48"
							/>
							{isUpdating && <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={toggleFullscreen}>
							{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								toast.info("Export functionality coming soon");
							}}
						>
							Export
						</Button>
					</div>
				</div>

				{!isFullscreen && (
					<div className="px-4 pb-4">
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							onBlur={handleUpdate}
							placeholder="Add a description..."
							rows={2}
							className="resize-none"
						/>
					</div>
				)}
			</div>

			{/* Drawing canvas */}
			<div className="flex-1 relative overflow-hidden">
				<ExcalidrawCanvas drawingId={drawingId} className="w-full h-full" />
			</div>
		</div>
	);
}
