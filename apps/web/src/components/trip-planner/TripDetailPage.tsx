import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format, differenceInDays, addDays, isAfter, isBefore } from "date-fns";
import { ArrowLeft, MapPin, Clock, Calendar, Edit, Trash2, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import type { Trip } from "./types";
import { cn } from "@/lib/utils";

interface TripDetailPageProps {
	trip?: Trip;
	isLoading?: boolean;
	onEdit?: (trip: Trip) => void;
	onDelete?: (tripId: string) => void;
	onAddItinerary?: (tripId: string) => void;
	className?: string;
}

export function TripDetailPage({
	trip,
	isLoading,
	onEdit,
	onDelete,
	onAddItinerary,
	className,
}: TripDetailPageProps) {
	const navigate = useNavigate();


	const [selectedDay, setSelectedDay] = useState<number>(1);

	if (isLoading) {
		return (
			<div className={cn("space-y-6", className)}>
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="space-y-4">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-48 w-full" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-48 w-full" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-48 w-full" />
					</div>
				</div>
			</div>
		);
	}

	if (!trip) {
		return (
			<div className={cn("space-y-6", className)}>
				<Card>
					<CardContent className="p-8 text-center">
						<h2 className="text-xl font-semibold mb-2">Trip not found</h2>
						<p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist.</p>
						<Button onClick={() => navigate({ to: "/trip-planner", search: { status: "upcoming" } })}>
							Back to All Trips
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const startDate = new Date(trip.startDate);
	const endDate = new Date(trip.endDate);
	const totalDays = differenceInDays(endDate, startDate) + 1;
	const today = new Date();

	const getTripStatus = () => {
		if (isAfter(today, endDate)) return "completed";
		if (isAfter(today, startDate) && isBefore(today, endDate)) return "ongoing";
		if (isAfter(startDate, today)) return "upcoming";
		return "upcoming";
	};

	const getStatusBadge = () => {
		const status = getTripStatus();
		const variants = {
			upcoming: { variant: "secondary" as const, label: "Upcoming" },
			ongoing: { variant: "default" as const, label: "In Progress" },
			completed: { variant: "outline" as const, label: "Completed" },
		};
		return <Badge variant={variants[status].variant}>{variants[status].label}</Badge>;
	};

	const getDayDate = (dayNumber: number) => {
		return addDays(startDate, dayNumber - 1);
	};

	const getTimelineDays = () => {
		return Array.from({ length: totalDays }, (_, i) => ({
			dayNumber: i + 1,
			date: getDayDate(i + 1),
			items: trip.itinerary?.filter(item => item.dayNumber === i + 1) || [],
		}));
	};

	const timelineDays = getTimelineDays();
	const selectedDayData = timelineDays.find(day => day.dayNumber === selectedDay) || timelineDays[0];

	const handleEditTrip = () => {
		onEdit?.(trip);
	};

	const handleDeleteTrip = () => {
		if (confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
			onDelete?.(trip.id);
		}
	};

	const handleBack = () => {
		navigate({ to: "/trip-planner", search: { status: "upcoming" } });
	};



	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" onClick={handleBack}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">{trip.name}</h1>
						<div className="flex items-center gap-2 mt-2">
							<p className="text-muted-foreground">
								{format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
							</p>
							{getStatusBadge()}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{trip.isPublic && (
						<Badge variant="outline" className="text-green-600 border-green-200">
							Public
						</Badge>
					)}
					{onEdit && (
						<Button variant="outline" size="sm" onClick={handleEditTrip}>
							<Edit className="h-4 w-4 mr-2" />
							Edit
						</Button>
					)}
					{onDelete && (
						<Button variant="outline" size="sm" onClick={handleDeleteTrip}>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete
						</Button>
					)}
					{onAddItinerary && (
						<Button size="sm" onClick={() => onAddItinerary(trip.id)}>
							<Plus className="h-4 w-4 mr-2" />
							Add Itinerary
						</Button>
					)}
				</div>
			</div>

			{/* Trip Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Trip Details */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Trip Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{trip.description && (
							<p className="text-muted-foreground">{trip.description}</p>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">Duration</p>
									<p className="font-medium">{totalDays} days</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<CalendarDays className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">Itinerary Items</p>
									<p className="font-medium">{trip.itinerary?.length || 0} items</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<MapPin className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">Destinations</p>
									<p className="font-medium">
										{new Set(trip.itinerary?.map(item => item.location?.city).filter(Boolean)).size} cities
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Clock className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">Status</p>
									<p className="font-medium">{getStatusBadge().props.children}</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

			 {/* Quick Stats */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Stats</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Completed Items</span>
							<span className="font-medium">
								{trip.itinerary?.filter(item => item.isCompleted).length || 0}/{trip.itinerary?.length || 0}
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full transition-all"
								style={{
									width: `${((trip.itinerary?.filter(item => item.isCompleted).length || 0) / (trip.itinerary?.length || 1)) * 100}%`,
								}}
							/>
						</div>

						{getTripStatus() === "ongoing" && (
							<div className="pt-2 border-t">
								<p className="text-sm text-muted-foreground">Days Remaining</p>
								<p className="font-medium text-lg">
									{Math.max(0, differenceInDays(endDate, today) + 1)} days
								</p>
							</div>
						)}

						{getTripStatus() === "upcoming" && (
							<div className="pt-2 border-t">
								<p className="text-sm text-muted-foreground">Days Until Trip</p>
								<p className="font-medium text-lg">
									{Math.max(0, differenceInDays(startDate, today))} days
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Timeline View */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Itinerary Timeline</CardTitle>
						{timelineDays.length > 0 && (
							<div className="flex items-center gap-2">
								{timelineDays.slice(0, 5).map((day) => (
									<Badge
										key={day.dayNumber}
										variant={selectedDay === day.dayNumber ? "default" : "outline"}
										className="cursor-pointer"
										onClick={() => setSelectedDay(day.dayNumber)}
									>
										Day {day.dayNumber}
									</Badge>
								))}
								{timelineDays.length > 5 && (
									<Badge variant="outline" className="cursor-pointer">
										+{timelineDays.length - 5} more
									</Badge>
								)}
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{selectedDayData.items.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">No items scheduled for this day</p>
							{onAddItinerary && (
								<Button onClick={() => onAddItinerary(trip.id)}>
									<Plus className="h-4 w-4 mr-2" />
									Add Activity
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">
									Day {selectedDay} - {format(selectedDayData.date, "EEEE, MMMM d, yyyy")}
								</h3>
								{onAddItinerary && (
									<Button size="sm" onClick={() => onAddItinerary(trip.id)}>
										<Plus className="h-4 w-4 mr-2" />
										Add Item
									</Button>
								)}
							</div>

							<div className="space-y-3">
								{selectedDayData.items
									.sort((a, b) => a.order - b.order)
									.map((item) => (
										<div
											key={item.id}
											className="flex items-start gap-4 p-4 border rounded-lg"
										>
											<div className="flex-shrink-0">
												<div className="w-2 h-2 bg-primary rounded-full mt-2" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<h4 className="font-medium">{item.title}</h4>
													<div className="flex items-center gap-2">
														{item.isCompleted && (
															<Badge variant="outline">Completed</Badge>
														)}
														{item.isRequired && (
															<Badge variant="destructive" className="text-xs">
																Required
															</Badge>
														)}
													</div>
												</div>
												{item.description && (
													<p className="text-sm text-muted-foreground mt-1">
														{item.description}
													</p>
												)}
												{item.location && (
													<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
														<MapPin className="h-4 w-4" />
														{item.location.city || item.location.address}
													</div>
												)}
												{item.startTime && item.endTime && (
													<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
														<Clock className="h-4 w-4" />
														{item.startTime} - {item.endTime}
													</div>
												)}
											</div>
										</div>
									))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			 {/* Related Trips */}
			{trip.itinerary && trip.itinerary.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Related Destinations</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from(
								new Set(
									trip.itinerary
										.map(item => item.location?.city)
										.filter(Boolean)
								)
							).slice(0, 3).map((city, index) => (
								<div
									key={index}
									className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
									onClick={() => {
										// Placeholder for navigation to destination page
									}}
								>
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">{city}</span>
									<span className="text-sm text-muted-foreground ml-auto">
										{trip.itinerary?.filter(item => item.location?.city === city).length || 0} activities
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}