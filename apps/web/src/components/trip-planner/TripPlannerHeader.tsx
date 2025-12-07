import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TripPlannerHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function TripPlannerHeader({
  title,
  description,
  showBackButton = true,
  backTo = "/trip-planner",
  actions,
  className
}: TripPlannerHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" asChild>
            <Link to={backTo}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}