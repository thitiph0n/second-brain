import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { mealApi } from '@/services/mealApi';
import type { 
  FoodEntry, 
  CreateFoodEntryRequest, 
  UpdateFoodEntryRequest, 
  MealType,
  CreateFavoriteFoodRequest
} from '@/types/meal';

interface FoodEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFoodEntryRequest) => Promise<void>;
  onUpdate?: (id: string, data: UpdateFoodEntryRequest) => Promise<void>;
  editingEntry?: FoodEntry | null;
  defaultMealType?: MealType;
  selectedDate?: string;
  isSubmitting?: boolean;
}

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'lunch', label: 'Lunch', icon: '🍽️' },
  { value: 'dinner', label: 'Dinner', icon: '🍖' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
];

export function FoodEntryForm({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingEntry,
  defaultMealType = 'snack',
  selectedDate,
  isSubmitting = false,
}: FoodEntryFormProps) {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(editingEntry);

  // Reset form when opening/closing or editing entry changes
  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        // Populate form with existing entry data
        setFoodName(editingEntry.food_name);
        setCalories(editingEntry.calories.toString());
        setProteinG(editingEntry.protein_g.toString());
        setCarbsG(editingEntry.carbs_g.toString());
        setFatG(editingEntry.fat_g.toString());
        setMealType(editingEntry.meal_type);
        setSaveAsFavorite(false); // Don't default to saving as favorite when editing
      } else {
        // Reset form for new entry
        setFoodName('');
        setCalories('');
        setProteinG('');
        setCarbsG('');
        setFatG('');
        setMealType(defaultMealType);
        setSaveAsFavorite(false);
      }
      setErrors({});
    }
  }, [isOpen, editingEntry, defaultMealType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!foodName.trim()) {
      newErrors.foodName = 'Food name is required';
    }

    const caloriesNum = parseFloat(calories);
    if (!calories || isNaN(caloriesNum) || caloriesNum < 0) {
      newErrors.calories = 'Valid calories value is required';
    }

    const proteinNum = parseFloat(proteinG);
    if (proteinG && (isNaN(proteinNum) || proteinNum < 0)) {
      newErrors.proteinG = 'Protein must be a valid positive number';
    }

    const carbsNum = parseFloat(carbsG);
    if (carbsG && (isNaN(carbsNum) || carbsNum < 0)) {
      newErrors.carbsG = 'Carbs must be a valid positive number';
    }

    const fatNum = parseFloat(fatG);
    if (fatG && (isNaN(fatNum) || fatNum < 0)) {
      newErrors.fatG = 'Fat must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data = {
      food_name: foodName.trim(),
      calories: parseFloat(calories),
      protein_g: parseFloat(proteinG) || 0,
      carbs_g: parseFloat(carbsG) || 0,
      fat_g: parseFloat(fatG) || 0,
      meal_type: mealType,
      entry_date: selectedDate,
      source: 'manual' as const,
    };

    try {
      if (isEditing && editingEntry && onUpdate) {
        await onUpdate(editingEntry.id, data);
        toast.success('Food entry updated successfully!');
      } else {
        await onSubmit(data);
        toast.success('Food entry added successfully!');
      }

      // Save as favorite if requested (only for new entries)
      if (saveAsFavorite && !isEditing) {
        try {
          const favoriteData: CreateFavoriteFoodRequest = {
            name: data.food_name,
            calories: data.calories,
            protein_g: data.protein_g,
            carbs_g: data.carbs_g,
            fat_g: data.fat_g,
            category: data.meal_type,
          };
          await mealApi.createFavoriteFood(favoriteData);
          toast.success('Food saved as favorite!');
        } catch (error) {
          // Don't fail the main operation if saving favorite fails
          console.error('Failed to save as favorite:', error);
          toast.error('Failed to save as favorite, but entry was added');
        }
      }

      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      throw error;
    }
  };

  const selectedMealType = MEAL_TYPES.find(type => type.value === mealType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditing ? 'Edit Food Entry' : 'Add Food Entry'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the nutrition information for this food entry.'
              : 'Enter the nutrition information for your food.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Food Name */}
          <div className="space-y-2">
            <Label htmlFor="foodName">Food Name *</Label>
            <Input
              id="foodName"
              type="text"
              placeholder="Enter food name..."
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              disabled={isSubmitting}
              className={errors.foodName ? 'border-red-500' : ''}
            />
            {errors.foodName && (
              <p className="text-sm text-red-500">{errors.foodName}</p>
            )}
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={isSubmitting}>
                  <span className="flex items-center gap-2">
                    <span>{selectedMealType?.icon}</span>
                    <span className="capitalize">{selectedMealType?.label}</span>
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {MEAL_TYPES.map((type) => (
                  <DropdownMenuItem key={type.value} onClick={() => setMealType(type.value)}>
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Calories */}
          <div className="space-y-2">
            <Label htmlFor="calories">Calories *</Label>
            <Input
              id="calories"
              type="number"
              placeholder="Enter calories..."
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              disabled={isSubmitting}
              min="0"
              step="1"
              className={errors.calories ? 'border-red-500' : ''}
            />
            {errors.calories && (
              <p className="text-sm text-red-500">{errors.calories}</p>
            )}
          </div>

          {/* Macronutrients Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="0"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                disabled={isSubmitting}
                min="0"
                step="0.1"
                className={errors.proteinG ? 'border-red-500' : ''}
              />
              {errors.proteinG && (
                <p className="text-sm text-red-500">{errors.proteinG}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="0"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                disabled={isSubmitting}
                min="0"
                step="0.1"
                className={errors.carbsG ? 'border-red-500' : ''}
              />
              {errors.carbsG && (
                <p className="text-sm text-red-500">{errors.carbsG}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="0"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                disabled={isSubmitting}
                min="0"
                step="0.1"
                className={errors.fatG ? 'border-red-500' : ''}
              />
              {errors.fatG && (
                <p className="text-sm text-red-500">{errors.fatG}</p>
              )}
            </div>
          </div>

          {/* Save as Favorite Checkbox (only for new entries) */}
          {!isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveAsFavorite"
                checked={saveAsFavorite}
                onCheckedChange={(checked) => setSaveAsFavorite(checked === true)}
                disabled={isSubmitting}
              />
              <Label htmlFor="saveAsFavorite" className="text-sm font-normal">
                Save as favorite food for quick adding later
              </Label>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Adding...') 
              : (isEditing ? 'Update Entry' : 'Add Entry')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}