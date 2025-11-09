import type { Drawing } from "@second-brain/types/drawing";
import { Link } from "@tanstack/react-router";
import { Folder, FolderInput, MoreVertical, Palette, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteDrawing } from "@/hooks/drawings/useDeleteDrawing";
import { MoveDrawingDialog } from "./MoveDrawingDialog";

interface DrawingItemCardProps {
	drawing: Drawing;
	onDelete?: (id: string) => void;
	onMove?: () => void;
	onFolderClick?: (id: string) => void;
	isDeleting?: boolean;
}

export function DrawingItemCard({ drawing, onDelete, onMove, onFolderClick, isDeleting }: DrawingItemCardProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

	const deleteDrawing = useDeleteDrawing({
		onSuccess: () => {
			onDelete?.(drawing.id);
		},
	});

	const handleDelete = () => {
		deleteDrawing.deleteDrawing(drawing.id);
	};

	const handleMove = () => {
		setIsMoveDialogOpen(true);
	};

	const handleClick = () => {
		if (drawing.type === "folder" && onFolderClick) {
			onFolderClick(drawing.id);
		}
	};

	const isFolder = drawing.type === "folder";
	const Icon = isFolder ? Folder : Palette;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<Card className="transition-all duration-200 hover:shadow-sm">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<div className="flex-shrink-0 flex items-center justify-center">
						<Icon className="h-8 w-8 text-muted-foreground" />
					</div>

					{isFolder && onFolderClick ? (
						<button
							onClick={handleClick}
							className="flex-1 min-w-0 hover:underline text-left"
						>
							<div className="flex flex-col justify-center">
								<h3 className="font-semibold leading-tight truncate">{drawing.title}</h3>
								<p className="text-sm text-muted-foreground leading-tight">
									Created: {formatDate(drawing.createdAt)}
								</p>
							</div>
						</button>
					) : (
						<Link
							to={`/drawings/$id`}
							params={{ id: drawing.id }}
							className="flex-1 min-w-0 hover:underline"
						>
							<div className="flex flex-col justify-center">
								<h3 className="font-semibold leading-tight truncate">{drawing.title}</h3>
								<p className="text-sm text-muted-foreground leading-tight">
									Created: {formatDate(drawing.createdAt)}
								</p>
							</div>
						</Link>
					)}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600"
								disabled={deleteDrawing.isPending || isDeleting}
							>
								<MoreVertical className="h-4 w-4" />
								<span className="sr-only">More options</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem asChild>
								<Link to={`/drawings/$id`} params={{ id: drawing.id }}>
									{isFolder ? "Open" : "Edit"}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleMove}>
								<FolderInput className="mr-2 h-4 w-4" />
								Move to folder
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-red-600 hover:text-red-700 focus:text-red-700"
								onClick={handleDelete}
								disabled={deleteDrawing.isPending || isDeleting}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{deleteDrawing.isPending || isDeleting ? "Deleting..." : "Delete"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<MoveDrawingDialog
						drawing={drawing}
						open={isMoveDialogOpen}
						onOpenChange={setIsMoveDialogOpen}
						onSuccess={() => {
							onMove?.();
						}}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
