import { Link } from "@tanstack/react-router";
import { Flame, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { mealTrackerAPI } from "../../api/meal-tracker";

export function CaloriesRingCard() {
  const today = new Date().toISOString().split('T')[0];

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["meal-tracker-profile"],
    queryFn: () => mealTrackerAPI.getProfile(),
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["meal-tracker-daily-summary", today],
    queryFn: () => mealTrackerAPI.getDailySummary(today),
  });

  const isLoading = profileLoading || summaryLoading;
  const profile = profileData;
  const dailySummary = summaryData?.dailySummary;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Skeleton className="h-40 w-40 rounded-full mb-4" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!profile || !dailySummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Calories Today
          </CardTitle>
          <CardDescription>
            Track your daily nutrition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center py-4">
            Set up your meal tracker profile to start tracking calories!
          </div>
          <Link to="/profile">
            <Button variant="outline" className="w-full">
              Set Up Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const totalCalories = dailySummary.totalCalories;
  const targetCalories = profile.targetCalories;
  const calorieProgress = (totalCalories / targetCalories) * 100;

  const getProgressColor = (progress: number) => {
    if (progress >= 95 && progress <= 105) return 'text-green-500';
    if (progress >= 85 && progress <= 115) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Calories Today
        </CardTitle>
        <CardDescription>
          Your daily nutrition progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
                opacity="0.2"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={getProgressColor(calorieProgress)}
                strokeDasharray={`${Math.min(calorieProgress, 100) * 2.51} 251.2`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="h-6 w-6 mb-1 text-orange-500" />
              <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
              <div className="text-xs text-muted-foreground">of {targetCalories}</div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {targetCalories - totalCalories > 0
            ? `${Math.round(targetCalories - totalCalories)} kcal remaining`
            : `${Math.round(totalCalories - targetCalories)} kcal over`}
        </div>

        <Link to="/meal-tracker">
          <Button variant="outline" className="w-full">
            View Meal Tracker
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
