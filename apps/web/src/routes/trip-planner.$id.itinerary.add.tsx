import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Clock, Users, Save, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequireAuth } from "../auth/components/AuthGuard";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/trip-planner/$id/itinerary/add")({
  component: AddItineraryItemPage,
  validateSearch: (search: Record<string, unknown>) => ({
    day: (search.day as number) || 1,
  }),
});

function AddItineraryItemPage() {
  return (
    <RequireAuth>
      <AddItineraryItemContent />
    </RequireAuth>
  );
}

function AddItineraryItemContent() {
  const navigate = useNavigate();
  const params = useParams({ from: "/trip-planner/$id/itinerary/add" });
  const tripId = params.id;
  const { day } = useSearch({ from: "/trip-planner/$id/itinerary/add" });

  const handleSave = () => {
    // TODO: Implement itinerary item creation
    navigate({ to: `/trip-planner/${tripId}` });
  };

  const handleCancel = () => {
    navigate({ to: `/trip-planner/${tripId}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Add Activity</h1>
          <p className="text-muted-foreground">
            Add an activity to Day {day} of your trip
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activityName">Activity Name</Label>
              <Input id="activityName" placeholder="Eiffel Tower Visit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activityType">Activity Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Champ de Mars, Paris" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Description of the activity..." />
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" type="number" placeholder="2" />
            </div>
          </CardContent>
        </Card>

        {/* People & Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              People & Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="people">Number of People</Label>
              <Input id="people" type="number" min="1" defaultValue="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (USD)</Label>
              <Input id="cost" type="number" placeholder="25" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerPerson">Cost Per Person</Label>
              <Input id="costPerPerson" type="number" placeholder="25" />
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="landmark, photography, romantic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://www.toureiffel.paris" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking">Booking Confirmation</Label>
              <Textarea id="booking" placeholder="Booking details or confirmation number..." />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional information or reminders..."
                rows={4}
              />
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
          Add Activity
        </Button>
      </div>
    </div>
  );
}