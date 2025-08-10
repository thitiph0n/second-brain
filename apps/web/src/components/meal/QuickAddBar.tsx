import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Star, ChevronDown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { FavoriteFood, MealType } from '@/types/meal';

interface QuickAddBarProps {
  favorites: FavoriteFood[];
  onAddFavoriteToLog: (favoriteId: string, mealType: MealType) => Promise<void>;
  onViewAllFavorites: () => void;
  isLoading?: boolean;
  isAdding?: boolean;
}

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'lunch', label: 'Lunch', icon: '🍽️' },
  { value: 'dinner', label: 'Dinner', icon: '🍖' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
];

interface FavoriteItemProps {
  favorite: FavoriteFood;
  onAddToLog: (mealType: MealType) => Promise<void>;
  isAdding: boolean;
}

function FavoriteItem({ favorite, onAddToLog, isAdding }: FavoriteItemProps) {
  const handleAddToLog = async (mealType: MealType) => {
    try {
      await onAddToLog(mealType);
      toast.success(`Added ${favorite.name} to ${mealType}!`);
    } catch (error) {
      toast.error(`Failed to add ${favorite.name}`);
    }
  };

  return (
    <div className="flex-shrink-0 w-64">
      <Card className="h-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Food Name and Usage */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate" title={favorite.name}>
                  {favorite.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    {favorite.usage_count} uses
                  </Badge>
                  {favorite.category && (
                    <Badge variant="secondary" className="text-xs">
                      {favorite.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Nutrition Info */}
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <p className="text-sm font-semibold text-orange-600">{favorite.calories}</p>
                <p className="text-xs text-muted-foreground">cal</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600">{favorite.protein_g}g</p>
                <p className="text-xs text-muted-foreground">P</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-600">{favorite.carbs_g}g</p>
                <p className="text-xs text-muted-foreground">C</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-600">{favorite.fat_g}g</p>
                <p className="text-xs text-muted-foreground">F</p>
              </div>
            </div>

            {/* Serving Size */}
            {favorite.serving_size && (
              <p className="text-xs text-muted-foreground text-center">
                Serving: {favorite.serving_size}
              </p>
            )}

            {/* Add Button with Meal Type Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  className="w-full text-xs" 
                  disabled={isAdding}
                  variant="outline"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to Log
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                {MEAL_TYPES.map((mealType) => (
                  <DropdownMenuItem
                    key={mealType.value}
                    onClick={() => handleAddToLog(mealType.value)}
                    disabled={isAdding}
                  >
                    <span className="mr-2">{mealType.icon}</span>
                    {mealType.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuickAddBar({ 
  favorites, 
  onAddFavoriteToLog, 
  onViewAllFavorites, 
  isLoading = false, 
  isAdding = false 
}: QuickAddBarProps) {
  // Sort favorites by usage count and last used date
  const topFavorites = [...favorites]
    .filter(fav => fav.usage_count > 0) // Only show favorites that have been used
    .sort((a, b) => {
      // Primary sort: usage count (descending)
      if (b.usage_count !== a.usage_count) {
        return b.usage_count - a.usage_count;
      }
      // Secondary sort: last used date (most recent first)
      const aLastUsed = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
      const bLastUsed = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
      return bLastUsed - aLastUsed;
    })
    .slice(0, 10); // Show top 10 most used favorites

  const handleAddFavoriteToLog = async (favoriteId: string, mealType: MealType) => {
    await onAddFavoriteToLog(favoriteId, mealType);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Quick Add Favorites</h3>
          </div>
          <div className="animate-pulse text-muted-foreground text-center py-4">
            Loading favorite foods...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topFavorites.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Quick Add Favorites</h3>
          </div>
          <div className="text-center py-6">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No favorite foods yet. Add some foods as favorites to see them here for quick access!
            </p>
            <Button variant="outline" onClick={onViewAllFavorites}>
              <Plus className="h-4 w-4 mr-2" />
              Manage Favorites
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Quick Add Favorites</h3>
            <Badge variant="outline" className="text-xs">
              {topFavorites.length} most used
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAllFavorites}
            className="text-xs"
          >
            View All
          </Button>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {topFavorites.map((favorite) => (
              <FavoriteItem
                key={favorite.id}
                favorite={favorite}
                onAddToLog={(mealType) => handleAddFavoriteToLog(favorite.id, mealType)}
                isAdding={isAdding}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}