import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFavorites, useDeleteFavorite, useCreateMeal } from '@/hooks/meal-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Trash2, Coffee, Sun, Moon, Apple } from 'lucide-react';
import { toast } from 'sonner';
import type { MealType } from '@/types/meal-tracker';

export function FavoritesList() {
  const queryClient = useQueryClient();
  const { data: favoritesData, isLoading } = useFavorites();
  const deleteFavorite = useDeleteFavorite();
  const createMeal = useCreateMeal();

  const favorites = favoritesData?.favorites || [];
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);

  const sortedFavorites = [...favorites].sort((a, b) => b.usage_count - a.usage_count);

  const handleQuickAdd = (favoriteId: string, mealType: MealType) => {
    const favorite = favorites.find(f => f.id === favoriteId);
    if (favorite) {
      const mealData = {
        meal_type: mealType,
        food_name: favorite.food_name,
        calories: favorite.calories,
        protein_g: favorite.protein_g || 0,
        carbs_g: favorite.carbs_g || 0,
        fat_g: favorite.fat_g || 0,
        serving_size: favorite.serving_size || '',
        serving_unit: favorite.serving_unit || '',
        notes: '',
      };

      // Optimistically update
      const currentMeals = (queryClient.getQueryData(['meal-tracker', 'meals']) as any)?.meals || [];
      const newMeal = {
        ...mealData,
        id: `temp-${Date.now()}`,
        logged_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['meal-tracker', 'meals'], {
        meals: [...currentMeals, newMeal],
        total: currentMeals.length + 1,
      });

      createMeal.mutate(mealData, {
        onSuccess: () => {
          // Update favorite usage count
          queryClient.setQueryData(['meal-tracker', 'favorites'], (oldData: any) => {
            if (!oldData) return { favorites: [], total: 0 };
            return {
              ...oldData,
              favorites: oldData.favorites.map((fav: any) =>
                fav.id === favoriteId
                  ? { ...fav, usage_count: fav.usage_count + 1, last_used_at: new Date().toISOString() }
                  : fav
              ),
            };
          });

          toast.success('Meal added from favorites!');
          setSelectedFavoriteId(null);
        },
        onError: () => {
          // Rollback optimistic update
          queryClient.setQueryData(['meal-tracker', 'meals'], (oldData: any) => ({
            ...oldData,
            meals: oldData.meals.filter((meal: any) => meal.id !== newMeal.id),
            total: Math.max(0, oldData.total - 1),
          }));
        },
      });
    }
  };

  const handleDelete = (favoriteId: string, foodName: string) => {
    if (window.confirm(`Remove "${foodName}" from favorites?`)) {
      deleteFavorite.mutate(favoriteId, {
        onSuccess: () => {
          toast.success('Removed from favorites');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Favorite Foods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Favorite Foods
          </CardTitle>
          <CardDescription>Save frequently eaten foods for quick logging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No favorite foods yet. Add meals to your favorites for quick logging!</p>
            <p className="text-sm mt-2">
              Tip: Use the "Save as Favorite" button when logging a meal
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Favorite Foods
        </CardTitle>
        <CardDescription>
          {favorites.length} favorite{favorites.length !== 1 ? 's' : ''} saved
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedFavorites.map((favorite) => (
            <div
              key={favorite.id}
              className="relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{favorite.food_name}</h4>
                  <div className="text-sm font-semibold text-muted-foreground">
                    {favorite.calories} kcal
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(favorite.id, favorite.food_name)}
                  disabled={deleteFavorite.isPending}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  {deleteFavorite.isPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                {favorite.protein_g > 0 && (
                  <span>P: {Math.round(favorite.protein_g)}g</span>
                )}
                {favorite.carbs_g > 0 && (
                  <span>C: {Math.round(favorite.carbs_g)}g</span>
                )}
                {favorite.fat_g > 0 && (
                  <span>F: {Math.round(favorite.fat_g)}g</span>
                )}
              </div>

              {favorite.serving_size && (
                <div className="text-xs text-muted-foreground mb-3">
                  {favorite.serving_size}{favorite.serving_unit ? ` ${favorite.serving_unit}` : ''}
                </div>
              )}

              {favorite.usage_count > 0 && (
                <Badge variant="secondary" className="mb-3">
                  Used {favorite.usage_count} time{favorite.usage_count !== 1 ? 's' : ''}
                </Badge>
              )}

              {selectedFavoriteId === favorite.id ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'breakfast' as MealType, icon: Coffee, label: 'Breakfast' },
                    { type: 'lunch' as MealType, icon: Sun, label: 'Lunch' },
                    { type: 'dinner' as MealType, icon: Moon, label: 'Dinner' },
                    { type: 'snack' as MealType, icon: Apple, label: 'Snack' },
                  ].map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdd(favorite.id, type)}
                      className="h-8 text-xs"
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedFavoriteId(favorite.id)}
                  disabled={createMeal.isPending}
                  className="w-full"
                >
                  {createMeal.isPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  ) : (
                    <Plus className="mr-2 h-3.5 w-3.5" />
                  )}
                  Quick Add
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
