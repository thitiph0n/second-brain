import { useNavigate } from "@tanstack/react-router";
import { format, isAfter, isBefore, isToday } from "date-fns";
import { MapPin, Calendar, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Trip, TripStatus } from "./types";

interface TripCardProps {
	trip: Trip;
	onEdit?: (trip: Trip) => void;
	onDelete?: (tripId: string) => void;
	className?: string;
	variant?: "default" | "compact";
}

export function TripCard({ trip, onEdit, onDelete, className, variant = "default" }: TripCardProps) {
	const navigate = useNavigate();

	const getTripStatus = (trip: Trip): TripStatus => {
		const now = new Date();
		const startDate = new Date(trip.startDate);
		const endDate = new Date(trip.endDate);

		if (isAfter(now, endDate)) return "completed";
		if (isBefore(now, startDate)) return "upcoming";
		if (isToday(startDate) || isToday(endDate) || (isAfter(now, startDate) && isBefore(now, endDate))) {
			return "ongoing";
		}
		return "upcoming";
	};

	const getStatusBadge = (status: TripStatus) => {
		const variants = {
			upcoming: { variant: "secondary" as const, label: "Upcoming" },
			ongoing: { variant: "default" as const, label: "In Progress" },
			completed: { variant: "outline" as const, label: "Completed" },
			cancelled: { variant: "destructive" as const, label: "Cancelled" },
		};

		const { variant: badgeVariant, label } = variants[status];
		return <Badge variant={badgeVariant}>{label}</Badge>;
	};

	const getStatusColor = (status: TripStatus) => {
		const colors = {
			upcoming: "text-blue-600 bg-blue-50 border-blue-200",
			ongoing: "text-green-600 bg-green-50 border-green-200",
			completed: "text-gray-600 bg-gray-50 border-gray-200",
			cancelled: "text-red-600 bg-red-50 border-red-200",
		};
		return colors[status];
	};

	const handleViewDetails = () => {
		navigate({
			to: "/trip-planner/$id",
			params: { id: trip.id },
		});
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit?.(trip);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
			onDelete?.(trip.id);
		}
	};

	const status = getTripStatus(trip);
	const statusColor = getStatusColor(status);
	const duration = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

	if (variant === "compact") {
		return (
			<Card
				className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}
				onClick={handleViewDetails}
			>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold truncate">{trip.name}</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
							</p>
						</div>
						{getStatusBadge(status)}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className={cn("hover:shadow-lg transition-shadow cursor-pointer group", className)}
			onClick={handleViewDetails}
		>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-lg truncate">{trip.name}</h3>
						<p className="text-muted-foreground text-sm mt-1 line-clamp-2">
							{trip.description || "No description provided"}
						</p>
					</div>
					{getStatusBadge(status)}
				</div>
			</CardHeader>

			<CardContent className="pt-0">
				<div className="space-y-3">
					{/* Date Range */}
					<div className="flex items-center gap-3 text-sm">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground">From</span>
						<span className="font-medium">
							{format(new Date(trip.startDate), "MMM d, yyyy")}
						</span>
						<span className="text-muted-foreground mx-1">to</span>
						<span className="font-medium">
							{format(new Date(trip.endDate), "MMM d, yyyy")}
						</span>
						<span className="text-muted-foreground ml-2">
							({duration} day{duration !== 1 ? "s" : ""})
						</span>
					</div>

				 {/* Location */}
					{trip.itinerary && trip.itinerary.length > 0 && (
						<div className="flex items-center gap-3 text-sm">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">Locations</span>
							<span className="font-medium">
								{new Set(trip.itinerary.map(item => item.location?.city).filter(Boolean)).size} cities
							</span>
						</div>
					)}

					{/* Itinerary Items Count */}
					{trip.itinerary && trip.itinerary.length > 0 && (
						<div className="flex items-center gap-3 text-sm">
							<CalendarDays className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">Itinerary</span>
							<span className="font-medium">
								{trip.itinerary.length} item{trip.itinerary.length !== 1 ? "s" : ""}
							</span>
						</div>
					)}

					{/* Public Status */}
					{trip.isPublic && (
						<div className="flex items-center gap-2 text-sm">
							<Users className="h-4 w-4 text-green-600" />
							<Badge variant="outline" className="text-green-600 border-green-200">
								Public
							</Badge>
						</div>
					)}
				</div>
			</CardContent>

			<CardFooter className="pt-3">
				<div className="flex items-center justify-between w-full">
					<div className={cn("text-xs font-medium px-2 py-1 rounded", statusColor)}>
						{getTripStatus(trip) === "ongoing" ? "Current Trip" : getStatusBadge(status).props.children}
					</div>

					<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
						{onEdit && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleEdit}
								className="h-8 w-8 p-0"
							>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</Button>
						)}

						{onDelete && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDelete}
								className="h-8 w-8 p-0 text-destructive hover:text-destructive"
							>
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</Button>
						)}
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}

export function TripCardSkeleton() {
	return (
		<Card className="opacity-70">
			<CardHeader>
				<div className="space-y-2">
					<Skeleton className="h-6 w-3/4" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}