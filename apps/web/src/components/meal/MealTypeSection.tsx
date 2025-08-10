import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Utensils } from 'lucide-react';
import { FoodEntryItem } from './FoodEntryItem';
import type { FoodEntry, MealType } from '@/types/meal';

interface MealTypeSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onAddEntry: (mealType: MealType) => void;
  onEditEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (id: string) => Promise<void>;
  isUpdating?: boolean;
}

const MEAL_TYPE_CONFIG = {
  breakfast: {
    label: 'Breakfast',
    icon: '🍳',
    description: 'Start your day right',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  lunch: {
    label: 'Lunch',
    icon: '🍽️',
    description: 'Midday fuel',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  dinner: {
    label: 'Dinner',
    icon: '🍖',
    description: 'Evening nourishment',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  snack: {
    label: 'Snacks',
    icon: '🍿',
    description: 'Quick bites',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
};

export function MealTypeSection({
  mealType,
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  isUpdating = false,
}: MealTypeSectionProps) {
  const config = MEAL_TYPE_CONFIG[mealType];
  
  // Calculate total calories for this meal type
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = entries.reduce((sum, entry) => sum + entry.protein_g, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs_g, 0);
  const totalFat = entries.reduce((sum, entry) => sum + entry.fat_g, 0);

  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center text-white text-lg`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {config.label}
                <Badge variant="outline" className="text-xs">
                  {entries.length} {entries.length === 1 ? 'item' : 'items'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddEntry(mealType)}
            disabled={isUpdating}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Nutrition Summary for this meal type */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-semibold text-orange-600">{totalCalories}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">{totalProtein.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">{totalCarbs.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-amber-600">{totalFat.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No food entries for {config.label.toLowerCase()} yet
            </p>
            <Button 
              variant="outline" 
              onClick={() => onAddEntry(mealType)}
              disabled={isUpdating}
              className="hover:bg-white dark:hover:bg-gray-950"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <FoodEntryItem
                key={entry.id}
                entry={entry}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}