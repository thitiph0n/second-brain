import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMeals, useCreateMeal, useUpdateMeal, useCreateFavorite } from '@/hooks/meal-tracker';
import { mealTrackerOptimistic } from '@/hooks/meal-tracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Star, Sparkles, Upload, X, Camera } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import type { MealType, MealFormData, FavoriteFood } from '@/types/meal-tracker';
import { toast } from 'sonner';
import { mealTrackerAPI } from '@/api/meal-tracker';

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

  const [isEstimating, setIsEstimating] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEstimateMacros = async () => {
    if (!formData.foodName) {
      toast.error('Please enter a food name first');
      return;
    }

    setIsEstimating(true);
    try {
      const response = await mealTrackerAPI.estimateMacros({
        foodName: formData.foodName,
        servingSize: formData.servingSize ? String(formData.servingSize) : undefined,
        servingUnit: formData.servingUnit ? String(formData.servingUnit) : undefined,
        notes: formData.notes,
      });

      const { estimation } = response;

      setFormData((prev) => ({
        ...prev,
        calories: estimation.calories,
        proteinG: estimation.proteinG,
        carbsG: estimation.carbsG,
        fatG: estimation.fatG,
      }));

      const confidenceEmoji = estimation.confidence === 'high' ? '✓' : estimation.confidence === 'medium' ? '~' : '?';
      toast.success(`Macros estimated with ${estimation.confidence} confidence ${confidenceEmoji}`, {
        description: estimation.reasoning,
      });
    } catch (error) {
      console.error('Failed to estimate macros:', error);
      toast.error('Failed to estimate macros. Please try again or enter manually.');
    } finally {
      setIsEstimating(false);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const compressed = await compressImage(file);
      setSelectedImage(compressed);

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);

      toast.success('Image loaded! Click "Analyze Image" to detect food.');
    } catch (error) {
      console.error('Failed to process image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzingImage(true);
    try {
      const response = await mealTrackerAPI.analyzeImage(selectedImage);

      setFormData((prev) => ({
        ...prev,
        foodName: response.foodName,
        calories: response.calories,
        proteinG: response.proteinG,
        carbsG: response.carbsG,
        fatG: response.fatG,
        servingSize: response.servingSize || prev.servingSize,
        servingUnit: response.servingUnit || prev.servingUnit,
      }));

      const confidenceEmoji = response.confidence === 'high' ? '✓' : response.confidence === 'medium' ? '~' : '?';
      toast.success(`Food detected with ${response.confidence} confidence ${confidenceEmoji}`, {
        description: response.description,
      });
    } catch (error) {
      console.error('Failed to analyze image:', error);
      toast.error('Failed to analyze image. Please try again or enter manually.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        {/* Image Upload Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Analyze from Photo
            </Label>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {!imagePreview ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Food Image
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="default"
                onClick={handleAnalyzeImage}
                disabled={isAnalyzingImage}
                className="w-full"
              >
                {isAnalyzingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Image with AI
                  </>
                )}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Upload a photo of your food to automatically detect and fill nutrition information
          </p>
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

        {/* AI Estimation Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleEstimateMacros}
            disabled={isEstimating || !formData.foodName}
            className="w-full sm:w-auto"
          >
            {isEstimating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Estimating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Estimate Macros with AI
              </>
            )}
          </Button>
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
