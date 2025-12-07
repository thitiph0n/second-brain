import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "../auth/components/AuthGuard";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/trip-planner/add")({
  component: AddTripPage,
});

function AddTripPage() {
  return (
    <RequireAuth>
      <AddTripPageContent />
    </RequireAuth>
  );
}

function AddTripPageContent() {
  const navigate = useNavigate();

  const handleSave = () => {
    // TODO: Implement trip creation
    navigate({ to: "/trip-planner", search: { status: "upcoming" } });
  };

  const handleCancel = () => {
    navigate({ to: "/trip-planner", search: { status: "upcoming" } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Plan New Trip</h1>
          <p className="text-muted-foreground">Create your next adventure</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tripName">Trip Name</Label>
              <Input id="tripName" placeholder="Paris Adventure" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" placeholder="Paris, France" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your trip..." />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" />
            </div>
          </CardContent>
        </Card>

        {/* Travelers */}
        <Card>
          <CardHeader>
            <CardTitle>Travelers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="travelers">Number of Travelers</Label>
              <Input id="travelers" type="number" min="1" defaultValue="1" />
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" type="number" placeholder="2000" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Create Trip
        </Button>
      </div>
    </div>
  );
}