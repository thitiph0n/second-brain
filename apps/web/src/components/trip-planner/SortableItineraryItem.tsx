import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItineraryItem as ItineraryItemComponent } from "./ItineraryItem";
import type { ItineraryItem } from "./types";
import { GripVertical } from "lucide-react";

interface SortableItineraryItemProps {
	item: ItineraryItem;
	onEdit?: (item: ItineraryItem) => void;
	onDelete?: (itemId: string) => void;
	onToggleComplete?: (itemId: string) => void;
	onViewImages?: (itemId: string) => void;
}

export function SortableItineraryItem({
	item,
	onEdit,
	onDelete,
	onToggleComplete,
	onViewImages,
}: SortableItineraryItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : 0,
		position: "relative" as const,
	};

	return (
		<div ref={setNodeRef} style={style} className="relative group">
			{/* Drag Handle */}
			<div
				{...attributes}
				{...listeners}
				className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<GripVertical className="h-4 w-4" />
			</div>

			{/* Item Content with left padding for handle */}
			<div className="pl-6">
				<ItineraryItemComponent
					item={item}
					onEdit={onEdit}
					onDelete={onDelete}
					onToggleComplete={onToggleComplete}
					onViewImages={onViewImages}
				/>
			</div>
		</div>
	);
}
