import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Clock, Edit, Trash2, CheckCircle, Circle, Image as ImageIcon, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "./types";

interface ItineraryItemProps {
	item: ItineraryItem;
	onEdit?: (item: ItineraryItem) => void;
	onDelete?: (itemId: string) => void;
	onToggleComplete?: (itemId: string) => void;
	onViewImages?: (itemId: string) => void;
	showActions?: boolean;
	className?: string;
}

export function ItineraryItem({
	item,
	onEdit,
	onDelete,
	onToggleComplete,
	onViewImages,
	showActions = true,
	className,
}: ItineraryItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const getCategoryIcon = (category: ItineraryItem["category"]) => {
		const icons = {
			accommodation: "🏨",
			transportation: "🚗",
			activity: "🎯",
			dining: "🍽️",
			shopping: "🛍️",
			attraction: "🏛️",
			rest: "😴",
			other: "📝",
		};
		return icons[category];
	};

	const getCategoryColor = (category: ItineraryItem["category"]) => {
		const colors = {
			accommodation: "bg-blue-50 text-blue-700 border-blue-200",
			transportation: "bg-green-50 text-green-700 border-green-200",
			activity: "bg-purple-50 text-purple-700 border-purple-200",
			dining: "bg-orange-50 text-orange-700 border-orange-200",
			shopping: "bg-pink-50 text-pink-700 border-pink-200",
			attraction: "bg-yellow-50 text-yellow-700 border-yellow-200",
			rest: "bg-gray-50 text-gray-700 border-gray-200",
			other: "bg-gray-50 text-gray-700 border-gray-200",
		};
		return colors[category];
	};

	const getTimeInfo = () => {
		if (item.startTime && item.endTime) {
			return `${item.startTime} - ${item.endTime}`;
		}
		if (item.startTime) {
			return `${item.startTime}`;
		}
		if (item.estimatedDuration) {
			return `~${item.estimatedDuration} min`;
		}
		return null;
	};

	const handleToggleComplete = () => {
		onToggleComplete?.(item.id);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
			onDelete?.(item.id);
		}
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit?.(item);
	};

	const handleViewImages = (e: React.MouseEvent) => {
		e.stopPropagation();
		onViewImages?.(item.id);
	};

	return (
		<Card
			className={cn(
				"transition-all hover:shadow-md",
				item.isCompleted && "opacity-70",
				isExpanded && "ring-2 ring-primary/20",
				className
			)}
		>
			<CardContent className="p-4">
				{/* Header */}
				<div className="flex items-start justify-between">
					{/* Left side */}
					<div className="flex items-start gap-3 flex-1 min-w-0">
						{/* Checkbox */}
						<button
							onClick={handleToggleComplete}
							className="flex-shrink-0 mt-0.5"
							aria-label={item.isCompleted ? "Mark as incomplete" : "Mark as complete"}
						>
							{item.isCompleted ? (
								<CheckCircle className="h-5 w-5 text-green-600" />
							) : (
								<Circle className="h-5 w-5 border-2 border-gray-300 hover:border-gray-400" />
							)}
						</button>

						 {/* Content */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className={`font-medium ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
									{item.title}
								</h3>
								<Badge variant="outline" className={cn("text-xs", getCategoryColor(item.category))}>
									{getCategoryIcon(item.category)} {item.category}
								</Badge>
								{item.isRequired && (
									<Badge variant="destructive" className="text-xs">
										Required
									</Badge>
								)}
							</div>

							{/* Description */}
							{item.description && (
								<p className={cn(
									"text-sm text-muted-foreground mb-2",
									item.isCompleted && "line-through"
								)}>
									{item.description}
								</p>
							)}

							 {/* Meta info */}
							<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
								{getTimeInfo() && (
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{getTimeInfo()}
									</div>
								)}

								{item.location?.city && (
									<div className="flex items-center gap-1">
										<MapPin className="h-3 w-3" />
										{item.location.city}
									</div>
								)}

								{item.images && item.images.length > 0 && (
									<div className="flex items-center gap-1">
										<ImageIcon className="h-3 w-3" />
										{item.images.length} photo{item.images.length !== 1 ? "s" : ""}
									</div>
								)}
							</div>
						</div>
					</div>

					 {/* Actions */}
					{showActions && (
						<div className="flex items-center gap-2">
							{item.images && item.images.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleViewImages}
									className="h-8 w-8 p-0"
								>
									<ImageIcon className="h-4 w-4" />
								</Button>
							)}

							<Button
								variant="ghost"
								size="sm"
								onClick={handleEdit}
								className="h-8 w-8 p-0"
							>
								<Edit className="h-4 w-4" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={handleDelete}
								className="h-8 w-8 p-0 text-destructive hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsExpanded(!isExpanded)}
								className="h-8 w-8 p-0"
							>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>

				 {/* Expanded content */}
				{isExpanded && (
					<div className="mt-4 pt-4 border-t space-y-3">
						{/* Notes */}
						{item.notes && (
							<div>
								<h4 className="text-sm font-medium mb-1">Notes</h4>
								<p className="text-sm text-muted-foreground">{item.notes}</p>
							</div>
						)}

						{/* Location details */}
						{item.location && (
							<div>
								<h4 className="text-sm font-medium mb-1">Location</h4>
								<div className="text-sm text-muted-foreground space-y-1">
									{item.location.address && <p>{item.location.address}</p>}
									{item.location.city && <p>{item.location.city}</p>}
									{item.location.country && <p>{item.location.country}</p>}
									{item.location.coordinates && (
										<p className="text-xs">
											Coords: {item.location.coordinates.latitude}, {item.location.coordinates.longitude}
										</p>
									)}
								</div>
							</div>
						)}

						 {/* Images gallery */}
						{item.images && item.images.length > 0 && (
							<div>
								<h4 className="text-sm font-medium mb-2">Photos</h4>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
									{item.images.slice(0, 3).map((image, index) => (
										<div key={image.id} className="relative aspect-square rounded overflow-hidden">
											<img
												src={image.url}
												alt={image.altText || `Photo ${index + 1}`}
												className="w-full h-full object-cover"
											/>
											{item.images!.length > 3 && index === 2 && (
												<div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
													+{item.images!.length - 3} more
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Creation info */}
						<div className="text-xs text-muted-foreground pt-2 border-t">
							Created: {format(new Date(item.createdAt), "MMM d, yyyy HH:mm")}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function ItineraryItemSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-6 w-16" />
					</div>
					<Skeleton className="h-4 w-full" />
					<div className="flex gap-4">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}