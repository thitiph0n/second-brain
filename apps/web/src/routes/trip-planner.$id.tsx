import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MapPin, Users, Plus, Share2, Edit, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { OfflineIndicator } from "@/components/trip-planner/OfflineIndicator";
import { ShareTripDialog } from "@/components/trip-planner/ShareTripDialog";

export const Route = createFileRoute("/trip-planner/$id")({
  component: TripDetailPage,
});

function TripDetailPage() {
  return (
      <TripDetailContent />
  );
}

function TripDetailContent() {
  const navigate = useNavigate();
  const params = useParams({ from: "/trip-planner/$id" });
  const tripId = params.id;
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

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
      // Prefetch trip details
      await queryClient.prefetchQuery({
        queryKey: ["trip", tripId],
        queryFn: () => fetch(`/api/v1/trip-planner/trips/${tripId}`).then(res => res.json())
      });
      
      // Prefetch itinerary
      await queryClient.prefetchQuery({
        queryKey: ["trip-itinerary", tripId],
        queryFn: () => fetch(`/api/v1/trip-planner/trips/${tripId}/itinerary`).then(res => res.json())
      });

      // Simple explicit fetch to ensure SW caches it if prefetch didn't trigger fetch event in same way (it should)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paris Adventure</h1>
            <p className="text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              Jun 15 - Jun 22, 2025 • 7 days
            </p>
          </div>
          <Badge variant="secondary">Upcoming</Badge>
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
              id: tripId!,
              userId: "mock-user",
              name: "Paris Adventure",
              description: "A week in the City of Light",
              status: "upcoming",
              startDate: new Date("2025-06-15").toISOString(),
              endDate: new Date("2025-06-22").toISOString(),
              isPublic: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              itinerary: []
            }}
            onShare={async (data) => {
              // TODO: Implement actual API call
              console.log("Updating share settings:", data);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }}
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

      {/* Trip Overview */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Destination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Paris, France</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Travelers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">2 people</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-medium">$3,000</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>Planning</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Itinerary</h2>
          <Button onClick={handleAddItinerary}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        <div className="space-y-4">
          {/* Day 1 */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border ml-4"></div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium z-10">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Day 1 - Arrival</h3>
                <div className="mt-2 space-y-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Flight from JFK to CDG</CardTitle>
                      <p className="text-sm text-muted-foreground">9:00 AM - 10:30 AM</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-16 w-full rounded" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Check-in at Hotel</CardTitle>
                      <p className="text-sm text-muted-foreground">11:00 AM</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-16 w-full rounded" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Day 2 */}
          <div className="relative">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium z-10">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Day 2 - City Exploration</h3>
                <div className="mt-2 space-y-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Eiffel Tower Visit</CardTitle>
                      <p className="text-sm text-muted-foreground">9:00 AM - 12:00 PM</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-16 w-full rounded" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Add more days as needed */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index + 3} className="relative">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium z-10">
                  {index + 3}
                </div>
                <div className="flex-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Day {index + 3}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Activities
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}