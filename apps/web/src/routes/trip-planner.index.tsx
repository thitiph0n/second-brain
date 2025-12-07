import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "../auth/components/AuthGuard";
import { LoadingCard } from "@/components/LoadingSpinner";
import { useTrips } from "@/hooks/trip-planner";

type TripStatus = "upcoming" | "ongoing" | "past";

export const Route = createFileRoute("/trip-planner/")({
  component: TripPlannerIndex,
  validateSearch: (search: Record<string, unknown>) => ({
    status: (search.status as TripStatus) || "upcoming",
  }),
});

function TripPlannerIndex() {
  return (
    <RequireAuth>
      <TripPlannerListContent />
    </RequireAuth>
  );
}

function TripPlannerListContent() {
	const navigate = useNavigate();
	const { status } = useSearch({ from: "/trip-planner/" });
	const [activeStatus, setActiveStatus] = useState<TripStatus>(status);

	// Use the real API hook
	const { data, isLoading, isError, error } = useTrips({ status: activeStatus });

	const handleStatusChange = (newStatus: TripStatus) => {
		setActiveStatus(newStatus);
		navigate({ to: "/trip-planner", search: { status: newStatus } });
	};

	const handleAddTrip = () => {
		navigate({ to: "/trip-planner/add" });
	};

	const handleViewTrip = (tripId: string) => {
		navigate({ to: `/trip-planner/${tripId}` });
	};

	// Format date range
	const formatDateRange = (startDate: string, endDate: string) => {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
		return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
	};

	// Get badge variant based on status
	const getStatusVariant = (tripStatus: string) => {
		switch (tripStatus) {
			case "upcoming":
				return "default";
			case "ongoing":
				return "secondary";
			case "past":
				return "outline";
			default:
				return "outline";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">My Trips</h1>
						<p className="text-muted-foreground">Plan and track your travel adventures</p>
					</div>
				</div>
				<Button onClick={handleAddTrip}>
					<Plus className="h-4 w-4 mr-2" />
					New Trip
				</Button>
			</div>

			{/* Status Tabs */}
			<div className="flex gap-2 flex-wrap">
				{(["upcoming", "ongoing", "past"] as TripStatus[]).map((tripStatus) => (
					<Button
						key={tripStatus}
						variant={activeStatus === tripStatus ? "default" : "outline"}
						onClick={() => handleStatusChange(tripStatus)}
					>
						{tripStatus.charAt(0).toUpperCase() + tripStatus.slice(1)}
					</Button>
				))}
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<LoadingCard key={index} lines={4} />
					))}
				</div>
			)}

			{/* Error State */}
			{isError && (
				<div className="text-center py-8">
					<p className="text-destructive">
						Failed to load trips: {error instanceof Error ? error.message : "Unknown error"}
					</p>
				</div>
			)}

			{/* Empty State */}
			{!isLoading && !isError && data?.trips.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground mb-4">
						No {activeStatus} trips found. Start planning your next adventure!
					</p>
					<Button onClick={handleAddTrip}>
						<Plus className="h-4 w-4 mr-2" />
						Create Your First Trip
					</Button>
				</div>
			)}

			{/* Trip List */}
			{!isLoading && !isError && data && data.trips.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{data.trips.map((trip) => (
						<Card
							key={trip.id}
							className="cursor-pointer hover:shadow-lg transition-shadow"
							onClick={() => handleViewTrip(trip.id)}
						>
							<CardHeader className="pb-3">
								<div className="flex justify-between items-start">
									<CardTitle className="text-lg">{trip.name}</CardTitle>
									<Badge variant={getStatusVariant(trip.status)}>
										{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar className="h-4 w-4" />
									<span>{formatDateRange(trip.startDate, trip.endDate)}</span>
								</div>
								{trip.description && (
									<p className="text-sm text-muted-foreground line-clamp-2">{trip.description}</p>
								)}
								{trip._count && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<MapPin className="h-4 w-4" />
										<span>{trip._count.itineraryItems} itinerary items</span>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}