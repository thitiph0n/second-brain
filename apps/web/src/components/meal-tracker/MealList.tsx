import { useMemo } from 'react';
import { useDeleteMeal } from '@/hooks/meal-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Coffee, Sun, Moon, Apple } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import type { Meal, MealType } from '@/types/meal-tracker';

interface MealListProps {
  onEditMeal: (mealId: string) => void;
}

const mealTypeConfig = {
  breakfast: { icon: Coffee, label: 'Breakfast', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  lunch: { icon: Sun, label: 'Lunch', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  dinner: { icon: Moon, label: 'Dinner', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  snack: { icon: Apple, label: 'Snack', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

export function MealList({ onEditMeal }: MealListProps) {
  const queryClient = useQueryClient();
  const deleteMeal = useDeleteMeal();

  // Get today's meals grouped by meal type
  const todayMeals = useMemo(() => {
    // Get meals from cache or data
    const cachedData = queryClient.getQueryData(['meal-tracker', 'meals']);
    const meals = (cachedData as any)?.meals || [];

    const today = new Date().toISOString().split('T')[0];
    const filtered = meals.filter((meal: any) =>
      meal.logged_at.split('T')[0] === today
    );

    // Group by meal type
    const grouped: Record<MealType, Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    filtered.forEach((meal: any) => {
      grouped[meal.meal_type as MealType].push(meal);
    });

    return grouped;
  }, [queryClient]);

  const handleDelete = async (mealId: string, foodName: string) => {
    if (window.confirm(`Are you sure you want to delete "${foodName}"?`)) {
      try {
        const mealToDelete = (queryClient.getQueryData(['meal-tracker', 'meals']) as any)?.meals?.find((m: any) => m.id === mealId);
        if (mealToDelete) {
          // Optimistically update
          queryClient.setQueryData(['meal-tracker', 'meals'], (oldData: any) => {
            if (!oldData) return { meals: [], total: 0 };
            return {
              meals: oldData.meals.filter((meal: Meal) => meal.id !== mealId),
              total: Math.max(0, oldData.total - 1),
            };
          });

          await deleteMeal.mutateAsync(mealId);
        }
      } catch (error) {
        // Error is handled by the mutation hook
      }
    }
  };

  const totalMeals = Object.values(todayMeals).flat().length;
  const isLoading = deleteMeal.isPending;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (totalMeals === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Meals</CardTitle>
          <CardDescription>No meals logged yet today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Start logging your first meal to track your nutrition!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Meals</CardTitle>
        <CardDescription>{totalMeals} meal{totalMeals !== 1 ? 's' : ''} logged</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
          const mealsForType = todayMeals[mealType];
          if (mealsForType.length === 0) return null;

          const config = mealTypeConfig[mealType];
          const Icon = config.icon;

          return (
            <div key={mealType} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold capitalize">{config.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {mealsForType.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {mealsForType.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium truncate">{meal.food_name}</h4>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {meal.calories} kcal
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                        {meal.protein_g > 0 && (
                          <span>P: {Math.round(meal.protein_g)}g</span>
                        )}
                        {meal.carbs_g > 0 && (
                          <span>C: {Math.round(meal.carbs_g)}g</span>
                        )}
                        {meal.fat_g > 0 && (
                          <span>F: {Math.round(meal.fat_g)}g</span>
                        )}
                        {meal.serving_size && (
                          <span>
                            {meal.serving_size}{meal.serving_unit ? ` ${meal.serving_unit}` : ''}
                          </span>
                        )}
                      </div>

                      {meal.notes && (
                        <p className="text-sm text-muted-foreground italic line-clamp-2 mb-2">
                          {meal.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(meal.logged_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditMeal(meal.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(meal.id, meal.food_name)}
                        disabled={isLoading}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        {isLoading ? (
                          <Skeleton className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
