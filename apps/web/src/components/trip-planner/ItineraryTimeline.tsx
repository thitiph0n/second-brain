import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, CheckCircle } from "lucide-react";
import { 
	DndContext, 
	closestCenter, 
	KeyboardSensor, 
	PointerSensor, 
	useSensor, 
	useSensors,
	DragOverlay,
	type DragStartEvent,
	type DragEndEvent
} from "@dnd-kit/core";
import { 
	arrayMove, 
	SortableContext, 
	sortableKeyboardCoordinates, 
	verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ItineraryItem, TimelineDay } from "./types";
import { ItineraryItem as ItineraryItemComponent } from "./ItineraryItem";
import { SortableItineraryItem } from "./SortableItineraryItem";

interface ItineraryTimelineProps {
	tripId: string;
	days: TimelineDay[];
	onEditItem?: (item: ItineraryItem) => void;
	onDeleteItem?: (itemId: string) => void;
	onToggleComplete?: (itemId: string) => void;
	onViewImages?: (itemId: string) => void;
	onReorderItems?: (tripId: string, itemIds: string[]) => void;
	className?: string;
}

export function ItineraryTimeline({
	tripId,
	days,
	onEditItem,
	onDeleteItem,
	onToggleComplete,
	onViewImages,
	onReorderItems,
	className,
}: ItineraryTimelineProps) {
	const [selectedDayIndex, setSelectedDayIndex] = useState(0);
	const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const selectedDay = days[selectedDayIndex];

	// Calculate stats
	const stats = days.reduce(
		(acc, day) => ({
			totalDays: days.length,
			completedItems: acc.completedItems + day.items.filter(item => item.isCompleted).length,
			totalItems: acc.totalItems + day.items.length,
			overallProgress: day.items.length > 0
				? (acc.completedItems + day.items.filter(item => item.isCompleted).length) / (acc.totalItems + day.items.length)
				: acc.overallProgress,
			upcomingItems: acc.upcomingItems + day.items.filter(item => !item.isCompleted).length,
		}),
		{ totalDays: 0, completedItems: 0, totalItems: 0, overallProgress: 0, upcomingItems: 0 }
	);
    
    // Unused but kept if needed for future features
	// const handleDaySelect = (index: number) => { ... } 

	const toggleDayExpand = (index: number) => {
		setExpandedDays(prev => {
			const newSet = new Set(prev);
			if (newSet.has(index)) {
				newSet.delete(index);
			} else {
				newSet.add(index);
			}
			return newSet;
		});
	};

	const handleNextDay = () => {
		if (selectedDayIndex < days.length - 1) {
			setSelectedDayIndex(selectedDayIndex + 1);
		}
	};

	const handlePreviousDay = () => {
		if (selectedDayIndex > 0) {
			setSelectedDayIndex(selectedDayIndex - 1);
		}
	};

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		setActiveId(active.id as string);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id && selectedDay) {
			const oldIndex = selectedDay.items.findIndex((item) => item.id === active.id);
			const newIndex = selectedDay.items.findIndex((item) => item.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newItems = arrayMove(selectedDay.items, oldIndex, newIndex);
				const newItemIds = newItems.map(item => item.id);
				
				// Optimistically update or just trigger callback
				if (onReorderItems) {
					onReorderItems(tripId, newItemIds);
				}
			}
		}

		setActiveId(null);
	};

	const getDayStatus = (day: TimelineDay) => {
		const completed = day.items.filter(item => item.isCompleted).length;
		const total = day.items.length;

		if (total === 0) return "empty";
		if (completed === total) return "completed";
		if (completed > 0) return "partial";
		return "upcoming";
	};

	const getStatusColor = (status: string) => {
		const colors = {
			empty: "bg-gray-100",
			completed: "bg-green-100",
			partial: "bg-yellow-100",
			upcoming: "bg-blue-100",
		};
		return colors[status as keyof typeof colors] || colors.empty;
	};

	const getDayStatusBadge = (day: TimelineDay) => {
		const status = getDayStatus(day);
		if (status === "empty") return null;

		const badges = {
			completed: { variant: "default" as const, label: "All Done" },
			partial: { variant: "secondary" as const, label: "In Progress" },
			upcoming: { variant: "outline" as const, label: "Upcoming" },
		};

		const badge = badges[status as keyof typeof badges];
		return badge ? (
			<Badge variant={badge.variant} className="text-xs">
				{badge.label}
			</Badge>
		) : null;
	};

	if (!selectedDay) {
		return <Skeleton className="h-64 w-full" />;
	}

	return (
		<div className={cn("space-y-6", className)}>
			{/* Timeline Navigation */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Trip Timeline</span>
							</div>
							{days.length > 0 && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<span>Day {selectedDay.dayNumber} of {days.length}</span>
									{getDayStatusBadge(selectedDay)}
								</div>
							)}
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePreviousDay}
								disabled={selectedDayIndex === 0}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleNextDay}
								disabled={selectedDayIndex === days.length - 1}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Day Overview */}
			{selectedDay.items.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{format(selectedDay.date, "EEEE, MMMM d, yyyy")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center">
								<p className="text-2xl font-bold text-blue-600">
									{selectedDay.items.length}
								</p>
								<p className="text-sm text-muted-foreground">Items</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-green-600">
									{selectedDay.items.filter(item => item.isCompleted).length}
								</p>
								<p className="text-sm text-muted-foreground">Completed</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-yellow-600">
									{selectedDay.items.filter(item => !item.isCompleted).length}
								</p>
								<p className="text-sm text-muted-foreground">Pending</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-purple-600">
									{new Set(selectedDay.items.map(item => item.category)).size}
								</p>
								<p className="text-sm text-muted-foreground">Categories</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Selected Day Items */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">
							Day {selectedDay.dayNumber} Activities
						</CardTitle>
						{selectedDay.items.length > 0 && (
							<div className="text-sm text-muted-foreground">
								{selectedDay.items.filter(item => item.isCompleted).length} / {selectedDay.items.length} completed
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{selectedDay.items.length === 0 ? (
						<div className="text-center py-12">
							<MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">No activities scheduled</h3>
							<p className="text-muted-foreground mb-4">
								Add some activities to make the most of your day!
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
							>
								<SortableContext 
									items={selectedDay.items.map(item => item.id)}
									strategy={verticalListSortingStrategy}
								>
									{selectedDay.items
										// We rely on the parent updating order, or we should maintain local state
										// For now, assume days[selectedDayIndex].items is fed in order
										// .sort((a, b) => a.order - b.order) // Already sorted in prop?
										.map((item) => (
											<SortableItineraryItem
												key={item.id}
												item={item}
												onEdit={onEditItem}
												onDelete={onDeleteItem}
												onToggleComplete={onToggleComplete}
												onViewImages={onViewImages}
											/>
										))}
								</SortableContext>
								<DragOverlay>
									{activeId ? (
										<ItineraryItemComponent
											item={selectedDay.items.find(i => i.id === activeId)!}
											onEdit={onEditItem}
											onDelete={onDeleteItem}
											onToggleComplete={onToggleComplete}
											onViewImages={onViewImages}
										/>
									) : null}
								</DragOverlay>
							</DndContext>
						</div>
					)}
				</CardContent>
			</Card>

			{/* All Days Timeline */}
			{days.length > 1 && (
				<Card>
					<CardHeader>
						<CardTitle>Complete Timeline</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{days.map((day, index) => (
								<div key={day.dayNumber}>
									<button
										onClick={() => toggleDayExpand(index)}
										className="flex items-center justify-between w-full p-3 hover:bg-accent rounded-lg transition-colors"
									>
										<div className="flex items-center gap-3">
											<div
												className={cn(
													"w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
													getStatusColor(getDayStatus(day))
												)}
											>
												{day.dayNumber}
											</div>
											<div className="text-left">
												<p className="font-medium">
													Day {day.dayNumber} - {format(day.date, "MMM d")}
												</p>
												<p className="text-sm text-muted-foreground">
													{day.items.length} items
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{getDayStatusBadge(day)}
											{expandedDays.has(index) ? (
												<ChevronRight className="h-4 w-4 transform rotate-90" />
											) : (
												<ChevronRight className="h-4 w-4" />
											)}
										</div>
									</button>

									{expandedDays.has(index) && (
										<div className="mt-2 ml-12 space-y-2">
											{day.items.length === 0 ? (
												<p className="text-sm text-muted-foreground">No items</p>
											) : (
												day.items
													.sort((a, b) => a.order - b.order)
													.map((item) => (
														<div
															key={item.id}
															className="flex items-center gap-2 p-2 border rounded"
														>
															{item.isCompleted ? (
																<CheckCircle className="h-4 w-4 text-green-600" />
															) : (
																<div className="w-4 h-4 border-2 border-gray-300 rounded" />
															)}
															<div className="flex-1">
																<p className="text-sm font-medium">
																	{item.title}
																</p>
																{item.startTime && (
																	<p className="text-xs text-muted-foreground">
																		<Clock className="h-3 w-3 inline mr-1" />
																		{item.startTime}
																	</p>
																)}
															</div>
															<Badge variant="outline" className="text-xs">
																{item.category}
															</Badge>
														</div>
													))
											)}
										</div>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Progress Overview */}
			<Card>
				<CardHeader>
					<CardTitle>Trip Progress</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm">Overall Progress</span>
							<span className="text-sm font-medium">
								{Math.round(stats.overallProgress * 100)}%
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full transition-all"
								style={{ width: `${stats.overallProgress * 100}%` }}
							/>
						</div>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<p className="text-2xl font-bold">{stats.totalDays}</p>
								<p className="text-sm text-muted-foreground">Days</p>
							</div>
							<div>
								<p className="text-2xl font-bold">{stats.completedItems}</p>
								<p className="text-sm text-muted-foreground">Done</p>
							</div>
							<div>
								<p className="text-2xl font-bold">{stats.upcomingItems}</p>
								<p className="text-sm text-muted-foreground">To Do</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}