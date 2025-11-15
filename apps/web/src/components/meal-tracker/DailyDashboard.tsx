import { useMemo, useState } from 'react';
import { useMealTracker } from '@/store/meal-tracker';
import { useUserProfile, useMeals, useDailySummary, useStreak } from '@/hooks/meal-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MealForm } from './MealForm';
import { MealList } from './MealList';
import { StreakWidget } from './StreakWidget';
import { FavoritesList } from './FavoritesList';
import { Plus, Flame, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { MealType } from '@/types/meal-tracker';

export function DailyDashboard() {
  const { setEditingMeal } = useMealTracker();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // Get local date in YYYY-MM-DD format
  const getLocalDateString = (date: Date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const today = getLocalDateString();
  const isToday = selectedDate === today;

  const { data: mealsData, isLoading: mealsLoading } = useMeals({ startDate: selectedDate });
  const { data: dailySummaryData, isLoading: summaryLoading } = useDailySummary(selectedDate);
  const { data: streakData, isLoading: streakLoading } = useStreak();

  const meals = mealsData?.meals || [];
  const dailySummaryFromAPI = dailySummaryData?.dailySummary || null;
  const streak = streakData?.streak || null;

  const [showMealForm, setShowMealForm] = useState(false);
  const [selectedMealType] = useState<MealType>('breakfast');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  // Calculate daily totals for selected date if we don't have summary from API
  const calculatedDailySummary = useMemo(() => {
    if (dailySummaryFromAPI) return dailySummaryFromAPI;

    // Use the same local date logic
    const selectedDateMeals = meals.filter((meal) =>
      meal.loggedAt.split('T')[0] === selectedDate
    );

    return {
      date: selectedDate,
      totalCalories: selectedDateMeals.reduce((sum, meal) => sum + meal.calories, 0),
      totalProteinG: selectedDateMeals.reduce((sum, meal) => sum + meal.proteinG, 0),
      totalCarbsG: selectedDateMeals.reduce((sum, meal) => sum + meal.carbsG, 0),
      totalFatG: selectedDateMeals.reduce((sum, meal) => sum + meal.fatG, 0),
      mealCount: selectedDateMeals.length,
      targetCalories: profile?.targetCalories || 0,
    };
  }, [meals, profile, dailySummaryFromAPI, selectedDate]);

  // Loading states
  const isLoading = profileLoading || mealsLoading || summaryLoading || streakLoading;

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-16 rounded-full mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const calorieProgress = (calculatedDailySummary.totalCalories / profile.targetCalories) * 100;
  const proteinProgress = (calculatedDailySummary.totalProteinG / profile.targetProteinG) * 100;
  const carbsProgress = (calculatedDailySummary.totalCarbsG / profile.targetCarbsG) * 100;
  const fatProgress = (calculatedDailySummary.totalFatG / profile.targetFatG) * 100;

  const getProgressColor = (progress: number) => {
    if (progress >= 95 && progress <= 105) return 'bg-green-500';
    if (progress >= 85 && progress <= 115) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleAddMeal = (mealType: MealType) => {
    setEditingMeal(null, mealType);
    setShowMealForm(true);
  };

  const handleEditMeal = (mealId: string) => {
    setEditingMealId(mealId);
    setShowMealForm(true);
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(getLocalDateString(date));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const nextDate = getLocalDateString(date);
    if (nextDate <= today) {
      setSelectedDate(nextDate);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    if (dateString === today) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateString === getLocalDateString(yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header with Hero Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meal Tracker</h1>
            <p className="text-muted-foreground">Track your daily nutrition and stay on target</p>
          </div>
          <Button onClick={() => handleAddMeal('breakfast')} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Log Meal
          </Button>
        </div>

        {/* Date Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3 flex-1 justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={today}
                  className="w-auto text-center font-semibold"
                />
                <span className="text-sm text-muted-foreground min-w-[120px] text-center">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                disabled={isToday}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section - Calories and Nutrition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Calorie Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
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
                    className={getProgressColor(calorieProgress).replace('bg-', 'text-')}
                    strokeDasharray={`${Math.min(calorieProgress, 100) * 2.51} 251.2`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Flame className="h-5 w-5 mb-1 text-orange-500" />
                  <div className="text-xl font-bold">{Math.round(calculatedDailySummary.totalCalories)}</div>
                  <div className="text-xs text-muted-foreground">of {profile.targetCalories}</div>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {profile.targetCalories - calculatedDailySummary.totalCalories > 0
                ? `${Math.round(profile.targetCalories - calculatedDailySummary.totalCalories)} kcal remaining`
                : `${Math.round(calculatedDailySummary.totalCalories - profile.targetCalories)} kcal over`}
            </div>
          </CardContent>
        </Card>

        {/* Macros Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Protein</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{Math.round(calculatedDailySummary.totalProteinG)}g</span>
              <span className="text-sm text-muted-foreground">/ {profile.targetProteinG}g</span>
            </div>
            <Progress value={Math.min(proteinProgress, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(proteinProgress)}% of target
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Carbs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{Math.round(calculatedDailySummary.totalCarbsG)}g</span>
              <span className="text-sm text-muted-foreground">/ {profile.targetCarbsG}g</span>
            </div>
            <Progress value={Math.min(carbsProgress, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(carbsProgress)}% of target
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{Math.round(calculatedDailySummary.totalFatG)}g</span>
              <span className="text-sm text-muted-foreground">/ {profile.targetFatG}g</span>
            </div>
            <Progress value={Math.min(fatProgress, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(fatProgress)}% of target
            </div>
          </CardContent>
        </Card>

          {/* Streak Widget - Compact */}
          <StreakWidget streak={streak} isLoading={streakLoading} />
        </div>
      </div>

      {/* Favorites List */}
      <FavoritesList />

      {/* Meal List */}
      <MealList meals={meals} onEditMeal={handleEditMeal} />

      {/* Meal Form Dialog */}
      {showMealForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <MealForm
              mealType={selectedMealType}
              editingMealId={editingMealId}
              onClose={() => {
                setShowMealForm(false);
                setEditingMealId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
