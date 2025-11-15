import { useState } from 'react';
import { useMealTracker } from '@/store/meal-tracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save, Star } from 'lucide-react';
import type { MealType, MealFormData } from '@/types/meal-tracker';
import { toast } from 'sonner';

interface MealFormProps {
  mealType?: MealType;
  editingMealId?: string | null;
  onClose: () => void;
}

export function MealForm({ mealType = 'breakfast', editingMealId, onClose }: MealFormProps) {
  const { meals, addMeal, updateMeal, addFavorite } = useMealTracker();

  const editingMeal = editingMealId
    ? meals.find((m) => m.id === editingMealId)
    : null;

  const [formData, setFormData] = useState<MealFormData>({
    meal_type: editingMeal?.meal_type || mealType,
    food_name: editingMeal?.food_name || '',
    calories: editingMeal?.calories || 0,
    protein_g: editingMeal?.protein_g || 0,
    carbs_g: editingMeal?.carbs_g || 0,
    fat_g: editingMeal?.fat_g || 0,
    serving_size: editingMeal?.serving_size || '',
    serving_unit: editingMeal?.serving_unit || '',
    notes: editingMeal?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMealId) {
      updateMeal(editingMealId, formData);
      toast.success('Meal updated successfully!');
    } else {
      addMeal(formData);
      toast.success('Meal logged successfully!');
    }

    onClose();
  };

  const handleChange = (field: keyof MealFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAsFavorite = () => {
    if (!formData.food_name || !formData.calories) {
      toast.error('Please enter food name and calories first');
      return;
    }

    addFavorite({
      food_name: formData.food_name,
      calories: formData.calories,
      protein_g: formData.protein_g || 0,
      carbs_g: formData.carbs_g || 0,
      fat_g: formData.fat_g || 0,
      serving_size: formData.serving_size,
      serving_unit: formData.serving_unit,
    });

    toast.success('Added to favorites!');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {editingMealId ? 'Edit Meal' : 'Log Meal'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meal Type */}
        <div className="space-y-2">
          <Label>Meal Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
              { value: 'lunch', label: 'Lunch', icon: '☀️' },
              { value: 'dinner', label: 'Dinner', icon: '🌙' },
              { value: 'snack', label: 'Snack', icon: '🍎' },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('meal_type', value as MealType)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  formData.meal_type === value
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

        {/* Food Name */}
        <div className="space-y-2">
          <Label htmlFor="food_name">Food Name *</Label>
          <Input
            id="food_name"
            value={formData.food_name}
            onChange={(e) => handleChange('food_name', e.target.value)}
            placeholder="e.g., Grilled chicken breast"
            required
          />
        </div>

        {/* Serving Size */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serving_size">Serving Size</Label>
            <Input
              id="serving_size"
              value={formData.serving_size || ''}
              onChange={(e) => handleChange('serving_size', e.target.value)}
              placeholder="e.g., 150"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serving_unit">Unit</Label>
            <Input
              id="serving_unit"
              value={formData.serving_unit || ''}
              onChange={(e) => handleChange('serving_unit', e.target.value)}
              placeholder="e.g., g, ml, piece"
            />
          </div>
        </div>

        {/* Nutrition */}
        <div className="space-y-4">
          <h3 className="font-semibold">Nutrition Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories * (kcal)</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                step="1"
                value={formData.calories}
                onChange={(e) => handleChange('calories', parseFloat(e.target.value) || 0)}
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
                value={formData.protein_g || ''}
                onChange={(e) => handleChange('protein_g', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                min="0"
                step="0.1"
                value={formData.carbs_g || ''}
                onChange={(e) => handleChange('carbs_g', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                min="0"
                step="0.1"
                value={formData.fat_g || ''}
                onChange={(e) => handleChange('fat_g', parseFloat(e.target.value) || 0)}
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
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {editingMealId ? 'Update Meal' : 'Log Meal'}
          </Button>
          {!editingMealId && (
            <Button type="button" variant="outline" onClick={handleSaveAsFavorite}>
              <Star className="mr-2 h-4 w-4" />
              Save as Favorite
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
