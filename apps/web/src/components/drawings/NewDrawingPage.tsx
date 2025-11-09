import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateDrawing } from "@/hooks/drawings/useCreateDrawing";
import { Toolbar } from "./Toolbar";

export function NewDrawingPage() {
	const navigate = useNavigate();
	const [drawingName, setDrawingName] = useState("");

	const { createDrawing, isPending } = useCreateDrawing({
		onSuccess: (drawing) => {
			// Navigate to the drawing after creation
			navigate({ to: `/drawings/$id`, params: { id: drawing.id } });
		},
	});

	const handleSave = () => {
		if (drawingName.trim()) {
			createDrawing({
				title: drawingName,
				content: "", // Empty content for new drawing
			});
		}
	};

	const handleSaveAs = () => {
		// For now, same as save
		handleSave();
	};

	return (
		<div className="flex h-screen flex-col">
			<Toolbar
				drawingName={drawingName}
				onDrawingNameChange={setDrawingName}
				onSave={handleSave}
				onSaveAs={handleSaveAs}
				onExit={() => navigate({ to: "/drawings" })}
			/>
			<div className="flex-1 bg-muted/50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-semibold mb-4">New Drawing</h2>
					<div className="max-w-sm mx-auto mb-4">
						<input
							type="text"
							placeholder="Enter drawing name..."
							value={drawingName}
							onChange={(e) => setDrawingName(e.target.value)}
							className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
							onKeyDown={(e) => {
								if (e.key === "Enter" && drawingName.trim() && !isPending) {
									handleSave();
								}
							}}
						/>
					</div>
					<p className="text-muted-foreground mb-4">Tldraw canvas will be rendered here</p>
					{isPending && <p className="text-sm text-muted-foreground">Creating drawing...</p>}
				</div>
			</div>
		</div>
	);
}
