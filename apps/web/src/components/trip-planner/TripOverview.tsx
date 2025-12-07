import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface TripOverviewData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  travelers: number;
  budget?: number;
  status: string;
}

interface TripOverviewProps {
  data?: TripOverviewData;
  isLoading?: boolean;
  className?: string;
}

export function TripOverview({
  data,
  isLoading = false,
  className
}: TripOverviewProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={className}>
      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Trip Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{data.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Destination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{data.destination}</span>
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
              <span className="font-medium">{data.travelers} people</span>
            </div>
          </CardContent>
        </Card>

        {data.budget && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-medium">${data.budget.toLocaleString()}</span>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{data.duration}</div>
            <p className="text-sm text-muted-foreground">
              {data.startDate} - {data.endDate}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{data.status}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}