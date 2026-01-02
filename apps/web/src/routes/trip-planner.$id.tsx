import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MapPin, Plus, Share2, Edit, Download, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { OfflineIndicator } from "@/components/trip-planner/OfflineIndicator";
import { ShareTripDialog } from "@/components/trip-planner/ShareTripDialog";
import { useTrip, useItineraryItems, useToggleSharing } from "@/hooks/trip-planner";
import { format, differenceInDays } from "date-fns";

export const Route = createFileRoute("/trip-planner/$id")({
  component: TripDetailPage,
});

function TripDetailPage() {
  const params = useParams({ from: "/trip-planner/$id" });
  const tripId = params.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  const { data: tripResponse, isLoading: isLoadingTrip, error: tripError } = useTrip(tripId!);
  const { data: itineraryResponse, isLoading: isLoadingItinerary } = useItineraryItems(tripId!);
  const toggleSharingMutation = useToggleSharing();

  const trip = tripResponse?.trip;
  const itineraryItems = itineraryResponse?.items || [];

  const handleBack = () => {
    navigate({ to: "/trip-planner", search: { status: "upcoming" } });
  };

  const handleAddItinerary = () => {
    navigate({ to: `/trip-planner/${tripId}/itinerary/add` });
  };

  const handleEditTrip = () => {
    navigate({ to: `/trip-planner/${tripId}/edit` });
  };

  const handleSaveOffline = async () => {
    setIsDownloading(true);
    try {
      await queryClient.prefetchQuery({
        queryKey: ["trip-planner", "trip", tripId],
      });

      await queryClient.prefetchQuery({
        queryKey: ["trip-planner", "itinerary", tripId],
      });

      await fetch(`/api/v1/trip-planner/trips/${tripId}`);
      await fetch(`/api/v1/trip-planner/trips/${tripId}/itinerary`);

      setIsOfflineReady(true);
      toast.success("Trip saved for offline use");
      setTimeout(() => setIsOfflineReady(false), 3000);
    } catch (error) {
      console.error("Failed to save offline:", error);
      toast.error("Failed to save trip. Check your connection.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (data: { isPublic: boolean }) => {
    try {
      await toggleSharingMutation.mutateAsync({
        tripId: tripId!,
        data: {
          isPublic: data.isPublic,
          generateShareToken: data.isPublic,
        },
      });
      toast.success("Sharing settings updated!");
    } catch (error) {
      toast.error(
        `Failed to update sharing: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  };

  if (isLoadingTrip) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (tripError || !trip) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
          <p className="text-muted-foreground mb-4">
            {tripError instanceof Error ? tripError.message : "The trip you're looking for doesn't exist."}
          </p>
          <Button onClick={handleBack}>Back to All Trips</Button>
        </CardContent>
      </Card>
    );
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const statusVariant = {
    upcoming: "secondary",
    ongoing: "default",
    past: "outline",
  } as const;

  const groupedItinerary = itineraryItems.reduce((acc, item) => {
    if (!acc[item.dayNumber]) {
      acc[item.dayNumber] = [];
    }
    acc[item.dayNumber].push(item);
    return acc;
  }, {} as Record<number, typeof itineraryItems>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            <p className="text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")} • {totalDays} days
            </p>
          </div>
          <Badge variant={statusVariant[trip.status]}>{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveOffline}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : isOfflineReady ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Saving..." : isOfflineReady ? "Saved" : "Save Offline"}
          </Button>

          <ShareTripDialog
            trip={{
              id: trip.id,
              userId: "",
              name: trip.name,
              description: trip.description || "",
              status: trip.status,
              startDate: trip.startDate,
              endDate: trip.endDate,
              isPublic: trip.isPublic,
              createdAt: trip.createdAt,
              updatedAt: trip.updatedAt,
              itinerary: [],
            }}
            onShare={handleShare}
          >
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </ShareTripDialog>
          <Button variant="outline" size="sm" onClick={handleEditTrip}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {trip.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{trip.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{totalDays} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Itinerary Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{itineraryItems.length} items</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={trip.isPublic ? "default" : "outline"}>
              {trip.isPublic ? "Public" : "Private"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Itinerary</h2>
          <Button onClick={handleAddItinerary}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        {isLoadingItinerary ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : Object.keys(groupedItinerary).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No activities added yet</p>
              <Button onClick={handleAddItinerary}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Activity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Array.from({ length: totalDays }).map((_, index) => {
              const dayNumber = index + 1;
              const items = groupedItinerary[dayNumber] || [];
              const dayDate = new Date(startDate);
              dayDate.setDate(dayDate.getDate() + index);

              return (
                <div key={dayNumber} className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border ml-4"></div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium z-10 flex-shrink-0">
                      {dayNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-3">
                        Day {dayNumber} - {format(dayDate, "EEEE, MMM d")}
                      </h3>

                      {items.length === 0 ? (
                        <Card>
                          <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">No activities scheduled</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {items
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((item) => (
                              <Card key={item.id}>
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-base">{item.placeName}</CardTitle>
                                      {item.time && (
                                        <p className="text-sm text-muted-foreground">{item.time}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        navigate({
                                          to: `/trip-planner/${tripId}/itinerary/${item.id}/edit`,
                                        })
                                      }
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                {(item.locationAddress || item.notes) && (
                                  <CardContent className="pt-0">
                                    {item.locationAddress && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <MapPin className="h-4 w-4" />
                                        {item.locationAddress}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                                    )}
                                  </CardContent>
                                )}
                              </Card>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}