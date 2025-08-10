import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Star, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Heart, 
  Filter,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import type { 
  FavoriteFood, 
  CreateFavoriteFoodRequest, 
  UpdateFavoriteFoodRequest,
  MealType 
} from '@/types/meal';

interface FavoriteFoodsListProps {
  favorites: FavoriteFood[];
  onCreateFavorite: (data: CreateFavoriteFoodRequest) => Promise<void>;
  onUpdateFavorite: (id: string, data: UpdateFavoriteFoodRequest) => Promise<void>;
  onDeleteFavorite: (id: string) => Promise<void>;
  onAddToLog: (favoriteId: string, mealType: MealType) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

interface FavoriteFormData {
  name: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  serving_size: string;
  category: string;
}

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'lunch', label: 'Lunch', icon: '🍽️' },
  { value: 'dinner', label: 'Dinner', icon: '🍖' },
  { value: 'snack', label: 'Snack', icon: '🍿' },
];

const CATEGORIES = [
  'All Categories',
  'breakfast',
  'lunch', 
  'dinner',
  'snack',
  'protein',
  'vegetables',
  'fruits',
  'grains',
  'dairy',
  'beverages',
];

export function FavoriteFoodsList({
  favorites,
  onCreateFavorite,
  onUpdateFavorite,
  onDeleteFavorite,
  onAddToLog,
  isLoading = false,
  isSubmitting = false,
}: FavoriteFoodsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showForm, setShowForm] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteFood | null>(null);
  const [formData, setFormData] = useState<FavoriteFormData>({
    name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    serving_size: '',
    category: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filter favorites
  const filteredFavorites = favorites.filter((favorite) => {
    const matchesSearch = favorite.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || 
                           favorite.category === selectedCategory ||
                           (!favorite.category && selectedCategory === 'uncategorized');
    return matchesSearch && matchesCategory;
  });

  const handleOpenForm = (favorite?: FavoriteFood) => {
    if (favorite) {
      setEditingFavorite(favorite);
      setFormData({
        name: favorite.name,
        calories: favorite.calories.toString(),
        protein_g: favorite.protein_g.toString(),
        carbs_g: favorite.carbs_g.toString(),
        fat_g: favorite.fat_g.toString(),
        serving_size: favorite.serving_size || '',
        category: favorite.category || '',
      });
    } else {
      setEditingFavorite(null);
      setFormData({
        name: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        serving_size: '',
        category: '',
      });
    }
    setErrors({});
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const calories = parseFloat(formData.calories);
    if (!formData.calories || isNaN(calories) || calories < 0) {
      newErrors.calories = 'Valid calories value is required';
    }

    const protein = parseFloat(formData.protein_g);
    if (formData.protein_g && (isNaN(protein) || protein < 0)) {
      newErrors.protein_g = 'Protein must be a valid positive number';
    }

    const carbs = parseFloat(formData.carbs_g);
    if (formData.carbs_g && (isNaN(carbs) || carbs < 0)) {
      newErrors.carbs_g = 'Carbs must be a valid positive number';
    }

    const fat = parseFloat(formData.fat_g);
    if (formData.fat_g && (isNaN(fat) || fat < 0)) {
      newErrors.fat_g = 'Fat must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: CreateFavoriteFoodRequest | UpdateFavoriteFoodRequest = {
      name: formData.name.trim(),
      calories: parseFloat(formData.calories),
      protein_g: parseFloat(formData.protein_g) || 0,
      carbs_g: parseFloat(formData.carbs_g) || 0,
      fat_g: parseFloat(formData.fat_g) || 0,
      serving_size: formData.serving_size.trim() || undefined,
      category: formData.category.trim() || undefined,
    };

    try {
      if (editingFavorite) {
        await onUpdateFavorite(editingFavorite.id, data);
        toast.success('Favorite food updated successfully!');
      } else {
        await onCreateFavorite(data as CreateFavoriteFoodRequest);
        toast.success('Favorite food created successfully!');
      }
      setShowForm(false);
    } catch (error) {
      // Error handling is done by parent component
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (showDeleteConfirm === id) {
      try {
        await onDeleteFavorite(id);
        toast.success('Favorite food deleted successfully!');
        setShowDeleteConfirm(null);
      } catch (error) {
        // Error handling is done by parent component
        throw error;
      }
    } else {
      setShowDeleteConfirm(id);
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };

  const handleAddToLog = async (favoriteId: string, mealType: MealType) => {
    try {
      await onAddToLog(favoriteId, mealType);
      toast.success(`Added to ${mealType}!`);
    } catch (error) {
      toast.error('Failed to add to log');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Favorite Foods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading favorite foods...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Favorite Foods
              <Badge variant="outline">{favorites.length} favorites</Badge>
            </CardTitle>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Favorite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search favorite foods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Filter className="h-4 w-4 mr-2" />
                  {selectedCategory}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {CATEGORIES.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Favorites List */}
          {filteredFavorites.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'All Categories'
                  ? 'No favorite foods match your search'
                  : 'No favorite foods yet'
                }
              </p>
              {!searchTerm && selectedCategory === 'All Categories' && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Favorite
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFavorites.map((favorite) => (
                <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Food Name and Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2" title={favorite.name}>
                            {favorite.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {favorite.usage_count}
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

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="flex-1 text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Add to Log
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            {MEAL_TYPES.map((mealType) => (
                              <DropdownMenuItem
                                key={mealType.value}
                                onClick={() => handleAddToLog(favorite.id, mealType.value)}
                              >
                                <span className="mr-2">{mealType.icon}</span>
                                {mealType.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="px-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenForm(favorite)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(favorite.id)}
                              className={`text-red-600 hover:text-red-700 focus:text-red-700 ${
                                showDeleteConfirm === favorite.id ? 'bg-red-50 dark:bg-red-950' : ''
                              }`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {showDeleteConfirm === favorite.id ? 'Confirm Delete' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFavorite ? 'Edit Favorite Food' : 'Add Favorite Food'}
            </DialogTitle>
            <DialogDescription>
              {editingFavorite 
                ? 'Update your favorite food information.'
                : 'Add a new favorite food for quick logging.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Food Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter food name..."
                disabled={isSubmitting}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Calories */}
            <div className="space-y-2">
              <label htmlFor="calories" className="text-sm font-medium">
                Calories *
              </label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                placeholder="Enter calories..."
                disabled={isSubmitting}
                min="0"
                step="1"
                className={errors.calories ? 'border-red-500' : ''}
              />
              {errors.calories && (
                <p className="text-sm text-red-500">{errors.calories}</p>
              )}
            </div>

            {/* Macronutrients */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="protein" className="text-sm font-medium">
                  Protein (g)
                </label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.protein_g}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein_g: e.target.value }))}
                  placeholder="0"
                  disabled={isSubmitting}
                  min="0"
                  step="0.1"
                  className={errors.protein_g ? 'border-red-500' : ''}
                />
                {errors.protein_g && (
                  <p className="text-sm text-red-500">{errors.protein_g}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="carbs" className="text-sm font-medium">
                  Carbs (g)
                </label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.carbs_g}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbs_g: e.target.value }))}
                  placeholder="0"
                  disabled={isSubmitting}
                  min="0"
                  step="0.1"
                  className={errors.carbs_g ? 'border-red-500' : ''}
                />
                {errors.carbs_g && (
                  <p className="text-sm text-red-500">{errors.carbs_g}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="fat" className="text-sm font-medium">
                  Fat (g)
                </label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.fat_g}
                  onChange={(e) => setFormData(prev => ({ ...prev, fat_g: e.target.value }))}
                  placeholder="0"
                  disabled={isSubmitting}
                  min="0"
                  step="0.1"
                  className={errors.fat_g ? 'border-red-500' : ''}
                />
                {errors.fat_g && (
                  <p className="text-sm text-red-500">{errors.fat_g}</p>
                )}
              </div>
            </div>

            {/* Serving Size */}
            <div className="space-y-2">
              <label htmlFor="serving" className="text-sm font-medium">
                Serving Size (optional)
              </label>
              <Input
                id="serving"
                value={formData.serving_size}
                onChange={(e) => setFormData(prev => ({ ...prev, serving_size: e.target.value }))}
                placeholder="e.g., 1 cup, 100g, 1 medium"
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category (optional)
              </label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., protein, vegetables, snack"
                disabled={isSubmitting}
              />
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting 
                ? (editingFavorite ? 'Updating...' : 'Adding...') 
                : (editingFavorite ? 'Update Favorite' : 'Add Favorite')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}