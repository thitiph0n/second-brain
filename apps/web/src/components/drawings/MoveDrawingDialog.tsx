import type { Drawing } from "@second-brain/types/drawing";
import { Folder, Home } from "lucide-react";
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
import { useDrawings } from "@/hooks/drawings/useDrawings";
import { useUpdateDrawing } from "@/hooks/drawings/useDrawing";

interface MoveDrawingDialogProps {
	drawing: Drawing;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function MoveDrawingDialog({
	drawing,
	open,
	onOpenChange,
	onSuccess,
}: MoveDrawingDialogProps) {
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
		drawing.parentId || null
	);

	const { data: allDrawings } = useDrawings();
	const { updateDrawing, isPending } = useUpdateDrawing(drawing.id);

	const folders = allDrawings.filter((d) => d.type === "folder" && d.id !== drawing.id);

	const handleMove = async () => {
		try {
			await updateDrawing({
				id: drawing.id,
				data: {
					parentId: selectedFolderId || undefined,
				},
			});
			onSuccess?.();
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to move drawing:", error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Move "{drawing.title}"</DialogTitle>
					<DialogDescription>
						Select a folder to move this {drawing.type === "folder" ? "folder" : "drawing"} to, or
						choose root to move it to the top level.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-2 py-4">
					<Button
						variant={selectedFolderId === null ? "default" : "outline"}
						className="justify-start"
						onClick={() => setSelectedFolderId(null)}
					>
						<Home className="mr-2 h-4 w-4" />
						Root (Top Level)
					</Button>
					{folders.map((folder) => (
						<Button
							key={folder.id}
							variant={selectedFolderId === folder.id ? "default" : "outline"}
							className="justify-start"
							onClick={() => setSelectedFolderId(folder.id)}
						>
							<Folder className="mr-2 h-4 w-4" />
							{folder.title}
						</Button>
					))}
					{folders.length === 0 && (
						<div className="text-sm text-muted-foreground text-center py-4">
							No folders available. Create a folder first to move items into it.
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleMove} disabled={isPending || selectedFolderId === drawing.parentId}>
						{isPending ? "Moving..." : "Move"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
