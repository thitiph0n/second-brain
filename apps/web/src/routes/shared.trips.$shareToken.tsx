import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingCard } from "@/components/LoadingSpinner";
import { useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/shared/trips/$shareToken")({
  component: SharedTripView,
});

function SharedTripView() {
  return <SharedTripContent />;
}

function SharedTripContent() {
  const navigate = useNavigate();
  const params = useParams({ from: "/shared/trips/$shareToken" });
  const shareToken = params.shareToken;

  const handleBack = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Shared Trip</h1>
          <p className="text-muted-foreground">
            View this shared itinerary
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Trip Overview */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Trip Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">Paris Adventure</div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">7 days</span>
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
      </div>

      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Itinerary</h2>
          <Badge variant="secondary">Shared by John Doe</Badge>
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
                      <p className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        9:00 AM - 10:30 AM
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LoadingCard lines={1} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Check-in at Hotel</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        11:00 AM
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LoadingCard lines={1} />
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
                      <p className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        9:00 AM - 12:00 PM
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LoadingCard lines={1} />
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
                      <LoadingCard lines={1} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Share This Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Anyone with this link can view the trip itinerary. No login required.
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-3 py-1 rounded text-sm">
              https://2b.thitiphon.me/shared/trips/{shareToken}
            </code>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`https://2b.thitiphon.me/shared/trips/${shareToken}`)}>
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}