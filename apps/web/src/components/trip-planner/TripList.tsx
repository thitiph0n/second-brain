import { useState, useMemo, useCallback } from "react";
import { Calendar, MapPin, Clock, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TripListSkeleton } from "./TripList.skeleton";
import { TripCard } from "./TripCard";
import { cn } from "@/lib/utils";
import type { Trip, TripFilters, TripStatus } from "./types";

interface TripListProps {
	trips: Trip[];
	isLoading?: boolean;
	onCreateNew?: () => void;
	onEditTrip?: (trip: Trip) => void;
	onDeleteTrip?: (tripId: string) => void;
	onFilterChange?: (filters: TripFilters) => void;
	className?: string;
}

export function TripList({
	trips,
	isLoading,
	onCreateNew,
	onEditTrip,
	onDeleteTrip,
	className,
}: TripListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [activeStatusFilter, setActiveStatusFilter] = useState<TripStatus[] | "all">("all");

	const tripStatuses: { value: TripStatus | "all"; label: string; icon?: React.ReactNode }[] = [
		{ value: "all", label: "All Trips" },
		{ value: "upcoming", label: "Upcoming", icon: <Calendar className="h-4 w-4" /> },
		{ value: "ongoing", label: "Current", icon: <Clock className="h-4 w-4" /> },
		{ value: "past", label: "Completed", icon: <MapPin className="h-4 w-4" /> },
	];

	const filterTrips = useCallback(
		(trips: Trip[], searchTerm: string, statusFilter: TripStatus[] | "all") => {
			return trips.filter((trip) => {
				const matchesSearch = !searchTerm ||
					trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					trip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					trip.itinerary?.some(item =>
						item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
						item.description?.toLowerCase().includes(searchTerm.toLowerCase())
					);

				const matchesStatus = statusFilter === "all" ||
					statusFilter.includes(getTripStatus(trip));

				return matchesSearch && matchesStatus;
			});
		},
		[]
	);

	const getTripStatus = (trip: Trip): TripStatus => {
		const now = new Date();
		const startDate = new Date(trip.startDate);
		const endDate = new Date(trip.endDate);

		if (endDate < now) return "past";
		if (startDate > now) return "upcoming";
		if (startDate <= now && endDate >= now) return "ongoing";
		return "upcoming";
	};

	const getTripsByStatus = useCallback(() => {
		const statusGroups: Record<TripStatus, Trip[]> = {
			upcoming: [],
			ongoing: [],
			past: [],
		};

		trips.forEach((trip) => {
			const status = getTripStatus(trip);
			statusGroups[status].push(trip);
		});

		return statusGroups;
	}, [trips]);

	const getFilteredTripsByStatus = useCallback(() => {
		const statusGroups = getTripsByStatus();
		const filtered: Record<TripStatus, Trip[]> = {
			upcoming: [],
			ongoing: [],
			past: [],
		};

		Object.entries(statusGroups).forEach(([status, trips]) => {
			if (activeStatusFilter === "all" || activeStatusFilter.includes(status as TripStatus)) {
				filtered[status as TripStatus] = filterTrips(trips, searchTerm, "all");
			}
		});

		return filtered;
	}, [trips, searchTerm, activeStatusFilter, getTripsByStatus, filterTrips]);

	const filteredTrips = useMemo(() => {
		return filterTrips(trips, searchTerm, activeStatusFilter);
	}, [trips, searchTerm, activeStatusFilter, filterTrips]);

	const tripsByStatus = getFilteredTripsByStatus();
	const stats = useMemo(() => {
		return {
			total: trips.length,
			upcoming: tripsByStatus.upcoming.length,
			ongoing: tripsByStatus.ongoing.length,
			past: tripsByStatus.past.length,
		};
	}, [tripsByStatus]);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleStatusFilterChange = (status: TripStatus[] | "all") => {
		setActiveStatusFilter(status);
	};



	if (isLoading) {
		return <TripListSkeleton />;
	}

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">My Trips</h1>
					<p className="text-muted-foreground">
						{trips.length === 0
							? "No trips planned yet. Create your first trip!"
							: `Manage your ${stats.total} trip${stats.total !== 1 ? "s" : ""}`}
					</p>
				</div>

				{onCreateNew && (
					<Button onClick={onCreateNew} size="lg">
						<Plus className="mr-2 h-4 w-4" />
						Create Trip
					</Button>
				)}
			</div>

			{/* Stats Cards */}
			{trips.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Total</p>
									<p className="text-2xl font-bold">{stats.total}</p>
								</div>
								<Calendar className="h-5 w-5 text-muted-foreground" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Upcoming</p>
									<p className="text-2xl font-bold">{stats.upcoming}</p>
								</div>
								<Calendar className="h-5 w-5 text-blue-500" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Current</p>
									<p className="text-2xl font-bold">{stats.ongoing}</p>
								</div>
								<Clock className="h-5 w-5 text-green-500" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">Completed</p>
									<p className="text-2xl font-bold">{stats.past}</p>
								</div>
								<MapPin className="h-5 w-5 text-gray-500" />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Search and Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						{/* Search */}
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search trips, destinations, or activities..."
								value={searchTerm}
								onChange={(e) => handleSearchChange(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Status Filter */}
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<div className="flex gap-1">
								{tripStatuses.map(({ value, label, icon }) => (
									<Badge
										key={value}
										variant={activeStatusFilter === value ? "default" : "outline"}
										className="cursor-pointer"
										onClick={() => handleStatusFilterChange(value === "all" ? "all" : [value])}
									>
										{icon}
										<span className="ml-1">{label}</span>
									</Badge>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Trips List */}
			{trips.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Calendar className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">No trips found</h3>
						<p className="text-muted-foreground text-center mb-6">
							{searchTerm
								? "Try adjusting your search or filters"
								: "Start planning your next adventure!"}
						</p>
						{onCreateNew && (
							<Button onClick={onCreateNew}>
								<Plus className="mr-2 h-4 w-4" />
								Create Your First Trip
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<>
					{/* All Trips View */}
					{activeStatusFilter === "all" && (
						<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
							{filteredTrips.map((trip) => (
								<TripCard
									key={trip.id}
									trip={trip}
									onEdit={onEditTrip}
									onDelete={onDeleteTrip}
									variant="default"
								/>
							))}
						</div>
					)}

				 {/* Status Tabs View */}
					{activeStatusFilter !== "all" && (
						<Tabs defaultValue="upcoming" className="space-y-6">
							<TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
								{tripStatuses
									.filter(status => status.value !== "all")
									.map(({ value, label, icon }) => (
										<TabsTrigger key={value} value={value} className="relative">
											{icon}
											<span className="ml-2">{label}</span>
											{tripsByStatus[value as TripStatus].length > 0 && (
												<Badge
													variant="secondary"
													className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
												>
													{tripsByStatus[value as TripStatus].length}
												</Badge>
											)}
										</TabsTrigger>
									))}
							</TabsList>

							{Object.entries(tripsByStatus).map(([status, trips]) => {
								if (trips.length === 0) return null;

								return (
									<TabsContent key={status} value={status} className="space-y-4">
										<h3 className="text-lg font-semibold capitalize">{status} Trips</h3>
										<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
											{trips.map((trip) => (
												<TripCard
													key={trip.id}
													trip={trip}
													onEdit={onEditTrip}
													onDelete={onDeleteTrip}
													variant="default"
												/>
											))}
										</div>
									</TabsContent>
								);
							})}
						</Tabs>
					)}
				</>
			)}
		</div>
	);
}