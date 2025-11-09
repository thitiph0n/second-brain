import { Archive, Clock, Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Drawing {
	id: string;
	title: string;
	content: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	isArchived: boolean;
}

interface DrawingCardProps {
	drawing: Drawing;
	onEdit?: (drawing: Drawing) => void;
	onDelete?: (id: string) => Promise<void>;
	isDeleting?: boolean;
}

export function DrawingCard({ drawing, onEdit, onDelete, isDeleting = false }: DrawingCardProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleDelete = async () => {
		if (showDeleteConfirm) {
			try {
				await onDelete?.(drawing.id);
				toast.success("Drawing deleted successfully");
				setShowDeleteConfirm(false);
			} catch (_error) {
				toast.error("Failed to delete drawing");
			}
		} else {
			setShowDeleteConfirm(true);
			// Auto-cancel after 3 seconds
			setTimeout(() => setShowDeleteConfirm(false), 3000);
		}
	};

	const formatDate = (dateString: string) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(dateString));
	};

	return (
		<Card
			className={`transition-all duration-200 ${
				drawing.isArchived ? "opacity-60 bg-muted/50" : ""
			} ${showDeleteConfirm ? "ring-2 ring-red-500" : ""}`}
		>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-sm truncate mb-1">{drawing.title}</h3>
						{drawing.description && (
							<p className="text-muted-foreground text-xs line-clamp-2">{drawing.description}</p>
						)}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 flex-shrink-0"
								disabled={isDeleting}
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-32">
							<DropdownMenuItem
								onClick={() => onEdit?.(drawing)}
								className="text-blue-600 hover:text-blue-700"
							>
								<Edit3 className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleDelete}
								className={`text-red-600 hover:text-red-700 focus:text-red-700 ${
									showDeleteConfirm ? "bg-red-50 dark:bg-red-950" : ""
								}`}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{showDeleteConfirm ? "Confirm" : "Delete"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{drawing.isArchived && (
						<Badge variant="secondary" className="text-xs">
							<Archive className="mr-1 h-3 w-3" />
							Archived
						</Badge>
					)}
					<Badge variant="outline" className="text-xs">
						<Edit3 className="mr-1 h-3 w-3" />
						Drawing
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="pt-0">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<div className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						<span>Updated: {formatDate(drawing.updatedAt)}</span>
					</div>
					<span>Created: {formatDate(drawing.createdAt)}</span>
				</div>
			</CardContent>
		</Card>
	);
}
