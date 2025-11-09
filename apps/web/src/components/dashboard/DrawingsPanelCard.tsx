import { Link } from "@tanstack/react-router";
import { Palette, FolderOpen, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { drawingApi } from "../../services/drawingApi";
import { formatDistanceToNow } from "date-fns";

export function DrawingsPanelCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["drawing-stats"],
    queryFn: () => drawingApi.getDrawingStats(),
  });

  const totalDrawings = stats?.totalDrawings || 0;
  const totalFolders = stats?.totalFolders || 0;
  const recentDrawings = stats?.recentDrawings || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Drawings
        </CardTitle>
        <CardDescription>
          Your visual workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalDrawings}</span>
            <span className="text-muted-foreground">drawings</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalFolders}</span>
            <span className="text-muted-foreground">folders</span>
          </div>
        </div>

        {recentDrawings && recentDrawings.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Recent</div>
            <div className="space-y-1">
              {recentDrawings.map((drawing) => (
                <Link
                  key={drawing.id}
                  to="/drawings/$id"
                  params={{ id: drawing.id }}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{drawing.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(drawing.updatedAt), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No drawings yet. Create your first drawing to get started!
          </div>
        )}

        <Link to="/drawings">
          <Button variant="outline" className="w-full">
            View All Drawings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
