import { useState } from 'react';
import { useFavorites, useDeleteFavorite, useCreateMeal } from '@/hooks/meal-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Trash2, Coffee, Sun, Moon, Apple, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getLocalDateString } from '@/lib/utils';
import type { MealType } from '@/types/meal-tracker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function FavoritesList() {
  const { data: favoritesData, isLoading } = useFavorites();
  const deleteFavorite = useDeleteFavorite();
  const createMeal = useCreateMeal();

  const favorites = favoritesData?.favorites || [];
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState<{ id: string; name: string } | null>(null);

  const sortedFavorites = [...favorites].sort((a, b) => b.usageCount - a.usageCount);

  const handleQuickAdd = (favoriteId: string, mealType: MealType) => {
    const favorite = favorites.find(f => f.id === favoriteId);
    if (favorite) {
      const localDateStr = getLocalDateString();

      // Use noon UTC for the local date to avoid timezone issues
      const loggedAtISO = new Date(localDateStr + 'T12:00:00.000Z').toISOString();

      const mealData = {
        mealType: mealType,
        foodName: favorite.foodName,
        calories: favorite.calories,
        proteinG: favorite.proteinG || 0,
        carbsG: favorite.carbsG || 0,
        fatG: favorite.fatG || 0,
        servingSize: favorite.servingSize || '',
        servingUnit: favorite.servingUnit || '',
        notes: '',
        loggedAt: loggedAtISO,
      };

      createMeal.mutate(mealData, {
        onSuccess: () => {
          setSelectedFavoriteId(null);
        },
      });
    }
  };

  const handleDeleteClick = (favoriteId: string, foodName: string) => {
    setFavoriteToDelete({ id: favoriteId, name: foodName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!favoriteToDelete) return;

    try {
      await deleteFavorite.mutateAsync(favoriteToDelete.id);
      toast.success('Removed from favorites');
      setDeleteDialogOpen(false);
      setFavoriteToDelete(null);
    } catch (error) {
      // Error is handled by the mutation hook
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
                  <h4 className="font-medium truncate">{favorite.foodName}</h4>
                  <div className="text-sm font-semibold text-muted-foreground">
                    {favorite.calories} kcal
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(favorite.id, favorite.foodName)}
                  disabled={deleteFavorite.isPending}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Remove from favorites"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                {favorite.proteinG > 0 && (
                  <span>P: {Math.round(favorite.proteinG)}g</span>
                )}
                {favorite.carbsG > 0 && (
                  <span>C: {Math.round(favorite.carbsG)}g</span>
                )}
                {favorite.fatG > 0 && (
                  <span>F: {Math.round(favorite.fatG)}g</span>
                )}
              </div>

              {favorite.servingSize && (
                <div className="text-xs text-muted-foreground mb-3">
                  {favorite.servingSize}{favorite.servingUnit ? ` ${favorite.servingUnit}` : ''}
                </div>
              )}

              {favorite.usageCount > 0 && (
                <Badge variant="secondary" className="mb-3">
                  Used {favorite.usageCount} time{favorite.usageCount !== 1 ? 's' : ''}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Favorite</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{favoriteToDelete?.name}&quot; from favorites? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteFavorite.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteFavorite.isPending}
            >
              {deleteFavorite.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
