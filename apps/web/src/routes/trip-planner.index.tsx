import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "../auth/components/AuthGuard";
import { LoadingCard } from "@/components/LoadingSpinner";

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
            <p className="text-muted-foreground">
              Plan and track your travel adventures
            </p>
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

      {/* Trip List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleViewTrip(`trip-${index + 1}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Trip to {["Paris", "Tokyo", "New York", "London", "Rome"][index % 5]}</CardTitle>
                <Badge variant={index % 3 === 0 ? "default" : index % 3 === 1 ? "secondary" : "outline"}>
                  {index % 3 === 0 ? "Upcoming" : index % 3 === 1 ? "Ongoing" : "Past"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Jun 15 - Jun 22, 2025</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Paris, France</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>2 travelers</span>
              </div>
              <div className="pt-2">
                <LoadingCard lines={2} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}