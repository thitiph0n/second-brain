import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Brain, User, Utensils } from 'lucide-react';
import type { FoodEntry } from '@/types/meal';

interface FoodEntryItemProps {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
}

export function FoodEntryItem({
  entry,
  onEdit,
  onDelete,
  isUpdating = false,
}: FoodEntryItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    onEdit(entry);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(entry.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🍳';
      case 'lunch':
        return '🍽️';
      case 'dinner':
        return '🍖';
      case 'snack':
        return '🍿';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'lunch':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'dinner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
      case 'snack':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const totalMacros = entry.protein_g + entry.carbs_g + entry.fat_g;
  const macroPercentages = totalMacros > 0 ? {
    protein: Math.round((entry.protein_g / totalMacros) * 100),
    carbs: Math.round((entry.carbs_g / totalMacros) * 100),
    fat: Math.round((entry.fat_g / totalMacros) * 100),
  } : { protein: 0, carbs: 0, fat: 0 };

  return (
    <Card className="transition-all duration-200 hover:shadow-sm">
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Left side: Food info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3 className="font-medium text-base break-words">{entry.food_name}</h3>
            </div>

            {/* Nutrition Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <p className="text-lg font-semibold text-orange-600">{entry.calories}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">{entry.protein_g}g</p>
                <p className="text-xs text-muted-foreground">Protein ({macroPercentages.protein}%)</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">{entry.carbs_g}g</p>
                <p className="text-xs text-muted-foreground">Carbs ({macroPercentages.carbs}%)</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-amber-600">{entry.fat_g}g</p>
                <p className="text-xs text-muted-foreground">Fat ({macroPercentages.fat}%)</p>
              </div>
            </div>

            {/* Badges and Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={getMealTypeColor(entry.meal_type)}>
                {getMealTypeIcon(entry.meal_type)} {entry.meal_type}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {entry.source === 'ai' ? (
                  <>
                    <Brain className="h-3 w-3 mr-1" />
                    AI Generated
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Manual Entry
                  </>
                )}
              </Badge>

              {entry.source === 'ai' && entry.ai_confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(entry.ai_confidence * 100)}% confidence
                </Badge>
              )}
            </div>

            {/* AI Original Description */}
            {entry.original_description && (
              <div className="mt-2 p-2 bg-muted rounded-sm">
                <p className="text-xs text-muted-foreground mb-1">Original description:</p>
                <p className="text-sm italic">"{entry.original_description}"</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2">
              <span>Added: {formatDate(entry.created_at)}</span>
              {entry.updated_at !== entry.created_at && (
                <span>Updated: {formatDate(entry.updated_at)}</span>
              )}
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex flex-row items-start gap-2 flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 flex-1 sm:flex-none sm:w-auto"
              onClick={handleEdit}
              disabled={isUpdating}
              title="Edit food entry"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600"
                  disabled={isUpdating}
                  title="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className={`text-red-600 hover:text-red-700 focus:text-red-700 ${
                    showDeleteConfirm ? 'bg-red-50 dark:bg-red-950' : ''
                  }`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {showDeleteConfirm ? 'Confirm' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}