import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Clock, Eye, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Trip } from "./types";

interface SharedTripPageProps {
	onNotFound?: () => void;
	className?: string;
}

export function SharedTripPage({ onNotFound, className }: SharedTripPageProps) {
	const navigate = useNavigate();
	const params = useParams({ from: "/shared/trips/$shareToken" });
	const [trip, setTrip] = useState<Trip | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeDay, setActiveDay] = useState<number | null>(null);
	const [showItinerary, setShowItinerary] = useState(false);

	// Mock trip data for demonstration
	// In a real app, this would be fetched from an API
	useEffect(() => {
		const fetchTrip = async () => {
			try {
				// Simulate API delay
				await new Promise(resolve => setTimeout(resolve, 1000));

				// Mock data
				const mockTrip: Trip = {
					id: params.shareToken,
					name: "Summer Adventure in Tokyo",
					description: "An amazing 7-day trip exploring the vibrant city of Tokyo, from traditional temples to modern skyscrapers and delicious food experiences.",
					startDate: new Date().toISOString().split("T")[0],
					endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
					status: "upcoming",
					isPublic: true,
					sharedAt: new Date().toISOString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					userId: "user123",
					itinerary: [
						{
							id: "1",
							tripId: params.shareToken,
							dayNumber: 1,
							title: "Arrive at Narita Airport",
							description: "Pick up JR Pass and take the Narita Express to Tokyo Station",
							location: {
								address: "1-1-3 Nishi-Nippori, Arakawa City",
								city: "Tokyo",
								country: "Japan",
							},
							category: "transportation",
							startTime: "14:00",
							endTime: "16:00",
							isRequired: true,
							isCompleted: false,
							order: 1,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						{
							id: "2",
							tripId: params.shareToken,
							dayNumber: 1,
							title: "Check-in at Hotel",
							description: "Drop off luggage at Shibuya Excel Hotel Tokyu",
							location: {
								address: "1-3-1 Dogenzaka, Shibuya City",
								city: "Tokyo",
								country: "Japan",
							},
							category: "accommodation",
							startTime: "16:30",
							endTime: "17:00",
							isRequired: true,
							isCompleted: false,
							order: 2,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						{
							id: "3",
							tripId: params.shareToken,
							dayNumber: 1,
							title: "Explore Shibuya Crossing",
							description: "Experience the world's busiest pedestrian crossing",
							location: {
								address: "Shibuya Scramble Crossing",
								city: "Tokyo",
								country: "Japan",
							},
							category: "attraction",
							startTime: "17:30",
							endTime: "19:00",
							isRequired: false,
							isCompleted: false,
							order: 3,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						{
							id: "4",
							tripId: params.shareToken,
							dayNumber: 1,
							title: "Dinner at Ichiran Ramen",
							description: "Famous tonkotsu ramen with customizable flavor",
							location: {
								address: "2-24-10 Dogenzaka",
								city: "Shibuya",
								country: "Japan",
							},
							category: "dining",
							startTime: "19:30",
							endTime: "21:00",
							isRequired: false,
							isCompleted: false,
							order: 4,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						// Add more itinerary items for other days...
					],
				};

				setTrip(mockTrip);
			} catch (error) {
				if (onNotFound) {
					onNotFound();
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchTrip();
	}, [params.shareToken, onNotFound]);

	const handleBack = () => {
		navigate({ to: "/" });
	};

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: trip?.name,
					text: `Check out this amazing trip!`,
					url: window.location.href,
				});
			} catch (error) {
				// User cancelled or error occurred
			}
		} else {
			// Fallback to copying URL
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(window.location.href);
				// Show toast notification
			}
		}
	};

	const getDayStatus = (dayNumber: number) => {
		if (!trip) return "upcoming";
		const today = new Date();
		const dayDate = new Date(trip.startDate);
		dayDate.setDate(dayDate.getDate() + dayNumber - 1);

		if (dayDate < today) return "completed";
		if (dayDate.toDateString() === today.toDateString()) return "ongoing";
		return "upcoming";
	};

	const getStatusColor = (status: string) => {
		const colors = {
			completed: "bg-green-100 text-green-700 border-green-200",
			ongoing: "bg-blue-100 text-blue-700 border-blue-200",
			upcoming: "bg-gray-100 text-gray-700 border-gray-200",
		};
		return colors[status as keyof typeof colors] || colors.upcoming;
	};

	const getStatusBadge = (status: string) => {
		const badges = {
			completed: { variant: "default" as const, label: "Completed" },
			ongoing: { variant: "default" as const, label: "Today" },
			upcoming: { variant: "outline" as const, label: "Upcoming" },
		};
		return badges[status as keyof typeof badges];
	};

	if (isLoading) {
		return (
			<div className={cn("space-y-6", className)}>
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Skeleton className="h-48" />
					<Skeleton className="h-48" />
					<Skeleton className="h-48" />
				</div>
			</div>
		);
	}

	if (!trip) {
		if (onNotFound) {
			onNotFound();
		}
		return null;
	}

	const totalDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
	const days = Array.from({ length: totalDays }, (_, i) => i + 1);

	return (
		<div className={cn("max-w-6xl mx-auto px-4 py-8 space-y-8", className)}>
		 {/* Header */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Button variant="ghost" onClick={handleBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-green-600 border-green-200">
							Public Trip
						</Badge>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleShare}
							className="h-8 w-8 p-0"
						>
							<Share2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold">{trip.name}</h1>
					<p className="text-lg text-muted-foreground">{trip.description}</p>
				</div>
			</div>

		 {/* Trip Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardContent className="p-6 text-center">
						<Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
						<p className="text-2xl font-bold">{totalDays}</p>
						<p className="text-sm text-muted-foreground">Days</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6 text-center">
						<MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
						<p className="text-2xl font-bold">
							{new Set(trip.itinerary?.map(item => item.location?.city).filter(Boolean)).size}
						</p>
						<p className="text-sm text-muted-foreground">Cities</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6 text-center">
						<Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
						<p className="text-2xl font-bold">{trip.itinerary?.length || 0}</p>
						<p className="text-sm text-muted-foreground">Activities</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6 text-center">
						<Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
						<p className="text-2xl font-bold">
							{trip.itinerary?.filter(item => item.isRequired).length || 0}
						</p>
						<p className="text-sm text-muted-foreground">Required</p>
					</CardContent>
				</Card>
			</div>

		 {/* Timeline Navigation */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Trip Timeline</CardTitle>
						<Button
							onClick={() => setShowItinerary(!showItinerary)}
							variant="outline"
							size="sm"
						>
							{showItinerary ? <Eye className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
							{showItinerary ? "Hide Itinerary" : "Show Itinerary"}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 overflow-x-auto pb-2">
						{days.map((day) => {
							const status = getDayStatus(day);
							return (
								<button
									key={day}
									onClick={() => setActiveDay(activeDay === day ? null : day)}
									className={cn(
										"flex-shrink-0 px-4 py-2 rounded-lg border text-center transition-colors",
										getStatusColor(status),
										activeDay === day && "ring-2 ring-primary"
									)}
								>
									<p className="font-medium">Day {day}</p>
									<p className="text-xs mt-1">
										{format(new Date(trip.startDate), "MMM d")}
									</p>
									{getStatusBadge(status) && (
										<Badge
											variant={getStatusBadge(status).variant}
											className="text-xs mt-1"
										>
											{getStatusBadge(status)?.label}
										</Badge>
									)}
								</button>
							);
						})}
					</div>
				</CardContent>
			</Card>

		 {/* Selected Day Details */}
			{activeDay && showItinerary && (
				<Card>
					<CardHeader>
						<CardTitle>
							Day {activeDay} - {format(new Date(trip.startDate), "MMMM d, yyyy")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{trip.itinerary
						?.filter(item => item.dayNumber === activeDay)
						.sort((a, b) => a.order - b.order)
						.length ?? 0 > 0 ? (
							<div className="space-y-4">
								{trip.itinerary
									?.filter(item => item.dayNumber === activeDay)
									.sort((a, b) => a.order - b.order)
									.map((item) => (
										<div key={item.id} className="border rounded-lg p-4">
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-semibold flex items-center gap-2">
														{item.title}
														{item.isRequired && (
															<Badge variant="destructive" className="text-xs">
																Required
															</Badge>
														)}
														<Badge variant="outline" className="text-xs">
															{item.category}
														</Badge>
													</h3>
													{item.description && (
														<p className="text-muted-foreground mt-1">
															{item.description}
														</p>
													)}
													{item.location?.city && (
														<p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
															<MapPin className="h-4 w-4" />
															{item.location.city}
															{item.location.address && `, ${item.location.address}`}
														</p>
													)}
													{item.startTime && (
														<p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
															<Clock className="h-4 w-4" />
															{item.startTime}
															{item.endTime && `- ${item.endTime}`}
														</p>
													)}
												</div>
											</div>
										</div>
									))}
							</div>
						) : (
							<div className="text-center py-8">
								<p className="text-muted-foreground">No activities scheduled for this day</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

		 {/* Note */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
				<p className="text-blue-800 text-sm">
					This is a shared view of the trip. You can view the itinerary but cannot make changes.
				</p>
			</div>
		</div>
	);
}