import type { Drawing, DrawingType } from "@second-brain/types/drawing";
import { FolderPlus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateDrawingDialog } from "@/hooks/drawings/useCreateDrawing";

interface CreateDrawingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type?: DrawingType;
	parentId?: string;
	onSuccess?: (drawing: Drawing) => void;
}

export function CreateDrawingDialog({
	open,
	onOpenChange,
	type = "drawing",
	parentId,
	onSuccess,
}: CreateDrawingDialogProps) {
	const { handleCreate, isPending } = useCreateDrawingDialog({
		onSuccess: (drawing: Drawing) => {
			onSuccess?.(drawing);
			onOpenChange(false);
			setDrawingName("");
		},
	});

	const [drawingName, setDrawingName] = useState("");

	const isFolder = type === "folder";
	const Icon = isFolder ? FolderPlus : Plus;

	const handleSubmit = () => {
		if (drawingName.trim()) {
			handleCreate({
				title: drawingName,
				type: type,
				parentId: parentId,
				content: isFolder ? undefined : "",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create New {isFolder ? "Folder" : "Drawing"}</DialogTitle>
					<DialogDescription>
						Enter a name for your new {isFolder ? "folder" : "drawing"}. You can always rename it
						later.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<label htmlFor="drawing-name" className="text-sm font-medium">
							{isFolder ? "Folder" : "Drawing"} Name
						</label>
						<Input
							id="drawing-name"
							placeholder={`Enter ${isFolder ? "folder" : "drawing"} name...`}
							value={drawingName}
							onChange={(e) => setDrawingName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSubmit();
								}
							}}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!drawingName.trim() || isPending}>
						<Icon className="mr-2 h-4 w-4" />
						{isPending ? "Creating..." : `Create ${isFolder ? "Folder" : "Drawing"}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
