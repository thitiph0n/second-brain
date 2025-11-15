import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMeals, useCreateMeal, useUpdateMeal, useCreateFavorite } from '@/hooks/meal-tracker';
import { mealTrackerOptimistic } from '@/hooks/meal-tracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Star } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import type { MealType, MealFormData, FavoriteFood } from '@/types/meal-tracker';
import { toast } from 'sonner';

interface MealFormProps {
  mealType?: MealType;
  editingMealId?: string | null;
  onClose: () => void;
  isStandalone?: boolean; // New prop to indicate standalone page usage
}

export function MealForm({ mealType = 'breakfast', editingMealId, onClose, isStandalone = false }: MealFormProps) {
  const queryClient = useQueryClient();
  const { data: mealsData } = useMeals();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const createFavorite = useCreateFavorite();

  const editingMeal = editingMealId && mealsData?.meals
    ? mealsData.meals.find((m) => m.id === editingMealId)
    : null;

  // Get local date in YYYY-MM-DD format
  const getLocalDateString = (date: Date = new Date()) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<MealFormData>({
    mealType: editingMeal?.mealType || mealType,
    foodName: editingMeal?.foodName || '',
    calories: editingMeal?.calories || 0,
    proteinG: editingMeal?.proteinG || 0,
    carbsG: editingMeal?.carbsG || 0,
    fatG: editingMeal?.fatG || 0,
    servingSize: editingMeal?.servingSize || '',
    servingUnit: editingMeal?.servingUnit || '',
    notes: editingMeal?.notes || '',
    loggedAt: editingMeal?.loggedAt ? editingMeal.loggedAt.split('T')[0] : getLocalDateString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert date to ISO datetime format
      const now = new Date();
      const selectedDate = formData.loggedAt || now.toISOString().split('T')[0];
      const todayDate = now.toISOString().split('T')[0];

      // If selected date is today, use current time. Otherwise use noon.
      let loggedAtISO: string;
      if (selectedDate === todayDate) {
        loggedAtISO = now.toISOString();
      } else {
        loggedAtISO = new Date(selectedDate + 'T12:00:00.000Z').toISOString();
      }

      const submissionData = {
        ...formData,
        loggedAt: loggedAtISO
      };

      if (editingMealId) {
        await updateMeal.mutateAsync({ id: editingMealId, data: submissionData });
        toast.success('Meal updated successfully!');
      } else {
        await createMeal.mutateAsync(submissionData);
        toast.success('Meal logged successfully!');
      }
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleSaveAsFavorite = async () => {
    if (!formData.foodName || !formData.calories) {
      toast.error('Please enter food name and calories first');
      return;
    }

    try {
      const favoriteData = {
        foodName: formData.foodName,
        calories: formData.calories,
        proteinG: formData.proteinG || 0,
        carbsG: formData.carbsG || 0,
        fatG: formData.fatG || 0,
        servingSize: formData.servingSize,
        servingUnit: formData.servingUnit,
      };

      const newFavorite: FavoriteFood = {
        ...favoriteData,
        id: `fav-${Date.now()}`,
        userId: 'current-user-id',
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add to favorites
      mealTrackerOptimistic.optimisticAddFavorite(queryClient, newFavorite);

      await createFavorite.mutateAsync(favoriteData);
      toast.success('Added to favorites!');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const isSubmitting = createMeal.isPending || updateMeal.isPending;

  const handleChange = (field: keyof MealFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0">
        {/* Meal Type */}
        <div className="space-y-2">
          <Label>Meal Type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
              { value: 'lunch', label: 'Lunch', icon: '☀️' },
              { value: 'dinner', label: 'Dinner', icon: '🌙' },
              { value: 'snack', label: 'Snack', icon: '🍎' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('mealType', value as MealType)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  formData.mealType === value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-accent'
                }`}
              >
                <div className="text-xl mb-1">{icon}</div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="loggedAt">Date</Label>
          <Input
            id="loggedAt"
            type="date"
            value={formData.loggedAt}
            onChange={(e) => handleChange('loggedAt', e.target.value)}
            max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Food Name */}
        <div className="space-y-2">
          <Label htmlFor="foodName">Food Name *</Label>
          <Input
            id="foodName"
            value={formData.foodName}
            onChange={(e) => handleChange('foodName', e.target.value)}
            placeholder="e.g., Grilled chicken breast"
            required
          />
        </div>

        {/* Serving Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="servingSize">Serving Size</Label>
            <Input
              id="servingSize"
              value={formData.servingSize || ''}
              onChange={(e) => handleChange('servingSize', e.target.value)}
              placeholder="e.g., 150"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="servingUnit">Unit</Label>
            <Input
              id="servingUnit"
              value={formData.servingUnit || ''}
              onChange={(e) => handleChange('servingUnit', e.target.value)}
              placeholder="e.g., g, ml, piece"
            />
          </div>
        </div>

        {/* Nutrition */}
        <div className="space-y-4">
          <h3 className="font-semibold">Nutrition Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories * (kcal)</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                step="1"
                value={formData.calories}
                onChange={(e) => handleChange('calories', parseFloat(e.target.value) || 0)}
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                min="0"
                step="0.1"
                value={formData.proteinG || ''}
                onChange={(e) => handleChange('proteinG', parseFloat(e.target.value) || 0)}
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                min="0"
                step="0.1"
                value={formData.carbsG || ''}
                onChange={(e) => handleChange('carbsG', parseFloat(e.target.value) || 0)}
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                min="0"
                step="0.1"
                value={formData.fatG || ''}
                onChange={(e) => handleChange('fatG', parseFloat(e.target.value) || 0)}
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any additional notes about this meal..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 pt-4 ${isStandalone ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
          <Button type="submit" className="flex-1 w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingMealId ? 'Updating...' : 'Logging...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {editingMealId ? 'Update Meal' : 'Log Meal'}
              </>
            )}
          </Button>

          {isStandalone && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}

          {!editingMealId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsFavorite}
              disabled={createFavorite.isPending}
              className="w-full sm:w-auto"
            >
              {createFavorite.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Save as Favorite
                </>
              )}
            </Button>
          )}
        </div>
      </form>
  );
}
