import { Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ItineraryItem {
  id: string;
  day: number;
  name: string;
  type: string;
  location: string;
  startTime: string;
  endTime: string;
  description?: string;
  cost?: number;
  costPerPerson?: number;
  people?: number;
}

export interface TimelineData {
  items: ItineraryItem[];
  totalDays: number;
}

interface TimelineProps {
  data?: TimelineData;
  isLoading?: boolean;
  showEmptyState?: boolean;
  onAddActivity?: (day: number) => void;
  className?: string;
}

export function Timeline({
  data,
  isLoading = false,
  showEmptyState = true,
  onAddActivity,
  className
}: TimelineProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Itinerary</h2>
          <Skeleton className="h-9 w-24 rounded" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border ml-4"></div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium z-10">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Day {index + 1}</h3>
                  <div className="mt-2 space-y-3">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <Card key={itemIndex}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Skeleton className="h-16 w-full rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Itinerary</h2>
          {onAddActivity && (
            <button
              onClick={() => onAddActivity(1)}
              className="text-sm text-primary hover:text-primary/80"
            >
              Add first activity
            </button>
          )}
        </div>
        {showEmptyState && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No activities planned yet. Start by adding your first activity!
              </p>
              {onAddActivity && (
                <button
                  onClick={() => onAddActivity(1)}
                  className="mt-4 text-sm text-primary hover:text-primary/80"
                >
                  Add Activity
                </button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Group items by day
  const itemsByDay = data.items.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Itinerary</h2>
        {onAddActivity && (
          <button
            onClick={() => onAddActivity(1)}
            className="text-sm text-primary hover:text-primary/80"
          >
            Add activity
          </button>
        )}
      </div>

      <div className="space-y-4">
        {Array.from({ length: data.totalDays }, (_, dayIndex) => {
          const day = dayIndex + 1;
          const dayItems = itemsByDay[day] || [];

          return (
            <div key={day} className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border ml-4"></div>
              <div className="flex gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10",
                  dayItems.length > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {day}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Day {day}</h3>
                  <div className="mt-2 space-y-3">
                    {dayItems.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-start justify-between">
                            <span>{item.name}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {item.type}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.startTime} - {item.endTime}
                            </span>
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {item.description && (
                            <p className="text-sm">{item.description}</p>
                          )}
                          {item.cost && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {item.people} people
                              </span>
                              <span className="font-medium">
                                ${item.cost.toLocaleString()}
                                {item.costPerPerson && ` (${item.costPerPerson} each)`}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {dayItems.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="text-center py-6">
                          <p className="text-muted-foreground text-sm">
                            No activities planned for Day {day}
                          </p>
                          {onAddActivity && (
                            <button
                              onClick={() => onAddActivity(day)}
                              className="mt-2 text-sm text-primary hover:text-primary/80"
                            >
                              Add Activity
                            </button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}