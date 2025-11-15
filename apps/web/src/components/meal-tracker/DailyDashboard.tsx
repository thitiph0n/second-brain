import { useMemo, useState } from 'react';
import { useMealTracker } from '@/store/meal-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MealForm } from './MealForm';
import { MealList } from './MealList';
import { StreakWidget } from './StreakWidget';
import { FavoritesList } from './FavoritesList';
import { Plus, Flame } from 'lucide-react';
import type { MealType } from '@/types/meal-tracker';

export function DailyDashboard() {
  const { profile, meals, streak } = useMealTracker();
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');

  // Calculate daily totals for today
  const dailySummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter((meal) =>
      meal.logged_at.split('T')[0] === today
    );

    return {
      total_calories: todayMeals.reduce((sum, meal) => sum + meal.calories, 0),
      total_protein_g: todayMeals.reduce((sum, meal) => sum + meal.protein_g, 0),
      total_carbs_g: todayMeals.reduce((sum, meal) => sum + meal.carbs_g, 0),
      total_fat_g: todayMeals.reduce((sum, meal) => sum + meal.fat_g, 0),
      meal_count: todayMeals.length,
    };
  }, [meals]);

  if (!profile) {
    return null;
  }

  const calorieProgress = (dailySummary.total_calories / profile.target_calories) * 100;
  const proteinProgress = (dailySummary.total_protein_g / profile.target_protein_g) * 100;
  const carbsProgress = (dailySummary.total_carbs_g / profile.target_carbs_g) * 100;
  const fatProgress = (dailySummary.total_fat_g / profile.target_fat_g) * 100;

  const getProgressColor = (progress: number) => {
    if (progress >= 95 && progress <= 105) return 'bg-green-500';
    if (progress >= 85 && progress <= 115) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleAddMeal = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setEditingMealId(null);
    setShowMealForm(true);
  };

  const handleEditMeal = (mealId: string) => {
    setEditingMealId(mealId);
    setShowMealForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meal Tracker</h1>
          <p className="text-muted-foreground">Track your daily nutrition and stay on target</p>
        </div>
        <Button onClick={() => handleAddMeal('breakfast')} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Log Meal
        </Button>
      </div>

      {/* Streak Widget */}
      {streak && <StreakWidget streak={streak} />}

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="text-xl font-bold">{Math.round(dailySummary.total_calories)}</div>
                  <div className="text-xs text-muted-foreground">of {profile.target_calories}</div>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {profile.target_calories - dailySummary.total_calories > 0
                ? `${Math.round(profile.target_calories - dailySummary.total_calories)} kcal remaining`
                : `${Math.round(dailySummary.total_calories - profile.target_calories)} kcal over`}
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
              <span className="text-2xl font-bold">{Math.round(dailySummary.total_protein_g)}g</span>
              <span className="text-sm text-muted-foreground">/ {profile.target_protein_g}g</span>
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
              <span className="text-2xl font-bold">{Math.round(dailySummary.total_carbs_g)}g</span>
              <span className="text-sm text-muted-foreground">/ {profile.target_carbs_g}g</span>
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
              <span className="text-2xl font-bold">{Math.round(dailySummary.total_fat_g)}g</span>
              <span className="text-sm text-muted-foreground">/ {profile.target_fat_g}g</span>
            </div>
            <Progress value={Math.min(fatProgress, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(fatProgress)}% of target
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Meal</CardTitle>
          <CardDescription>Select a meal type to log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: 'breakfast' as MealType, label: 'Breakfast', icon: '🌅' },
              { type: 'lunch' as MealType, label: 'Lunch', icon: '☀️' },
              { type: 'dinner' as MealType, label: 'Dinner', icon: '🌙' },
              { type: 'snack' as MealType, label: 'Snack', icon: '🍎' },
            ].map(({ type, label, icon }) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => handleAddMeal(type)}
                className="h-20 flex-col gap-2"
              >
                <span className="text-2xl">{icon}</span>
                <span>{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorites List */}
      <FavoritesList />

      {/* Meal List */}
      <MealList onEditMeal={handleEditMeal} />

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
