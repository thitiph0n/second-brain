import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Utensils, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, addDays } from 'date-fns';
import { mealApi, ApiError } from '@/services/mealApi';
import { DailyNutritionSummary } from './DailyNutritionSummary';
import { MealTypeSection } from './MealTypeSection';
import { FoodEntryForm } from './FoodEntryForm';
import { ProfileSetup } from './ProfileSetup';
import { QuickAddBar } from './QuickAddBar';
import { FavoriteFoodsList } from './FavoriteFoodsList';
import type { 
  DailyNutritionSummary as DailyNutritionSummaryType,
  FoodEntry,
  CreateFoodEntryRequest,
  UpdateFoodEntryRequest,
  UserProfile,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  ProfileTracking,
  CreateProfileTrackingRequest,
  FavoriteFood,
  CreateFavoriteFoodRequest,
  UpdateFavoriteFoodRequest,
  MealType
} from '@/types/meal';

export function MealTrackerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummaryType | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestTracking, setLatestTracking] = useState<ProfileTracking | null>(null);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  
  // Loading states
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  
  // Form states
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [defaultMealType, setDefaultMealType] = useState<MealType>('snack');
  
  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Load all data on mount and when date changes
  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  const loadAllData = async () => {
    await Promise.all([
      loadDailySummary(),
      loadProfile(),
      loadFavorites(),
    ]);
  };

  const loadDailySummary = async () => {
    try {
      setIsLoadingSummary(true);
      setError(null);
      const summary = await mealApi.getDailyNutrition(dateString);
      setDailySummary(summary);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
      if (err instanceof ApiError && err.status === 404) {
        // No data for this date is fine
        setDailySummary(null);
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load daily summary');
      }
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profileData = await mealApi.getUserProfile();
      setProfile(profileData);
      
      // Load latest tracking
      const history = await mealApi.getProfileHistory();
      if (history.history.length > 0) {
        setLatestTracking(history.history[0]); // Most recent first
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      if (err instanceof ApiError && err.status === 404) {
        // No profile yet is fine
        setProfile(null);
        setLatestTracking(null);
      } else {
        console.error('Profile loading error:', err);
      }
    } finally {
    }
  };

  const loadFavorites = async () => {
    try {
      setIsLoadingFavorites(true);
      const response = await mealApi.getFavoriteFoods();
      setFavorites(response.favorites);
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setFavorites([]);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  // Date navigation
  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Food entry handlers
  const handleAddEntry = (mealType: MealType) => {
    setDefaultMealType(mealType);
    setEditingEntry(null);
    setShowFoodForm(true);
  };

  const handleEditEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setShowFoodForm(true);
  };

  const handleCreateEntry = async (data: CreateFoodEntryRequest) => {
    setIsSubmitting(true);
    try {
      const entryData = { ...data, entry_date: dateString };
      const response = await mealApi.createFoodEntry(entryData);
      
      // Update daily summary with new entry
      if (dailySummary) {
        setDailySummary({
          ...dailySummary,
          entries: [...dailySummary.entries, response.entry],
          total_calories: dailySummary.total_calories + response.entry.calories,
          total_protein_g: dailySummary.total_protein_g + response.entry.protein_g,
          total_carbs_g: dailySummary.total_carbs_g + response.entry.carbs_g,
          total_fat_g: dailySummary.total_fat_g + response.entry.fat_g,
        });
      } else {
        // Reload if we had no data before
        await loadDailySummary();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async (id: string, data: UpdateFoodEntryRequest) => {
    setIsUpdating(true);
    try {
      const response = await mealApi.updateFoodEntry(id, data);
      
      // Update daily summary
      if (dailySummary) {
        const updatedEntries = dailySummary.entries.map(entry =>
          entry.id === id ? response.entry : entry
        );
        
        // Recalculate totals
        const newTotals = updatedEntries.reduce(
          (acc, entry) => ({
            calories: acc.calories + entry.calories,
            protein: acc.protein + entry.protein_g,
            carbs: acc.carbs + entry.carbs_g,
            fat: acc.fat + entry.fat_g,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        setDailySummary({
          ...dailySummary,
          entries: updatedEntries,
          total_calories: newTotals.calories,
          total_protein_g: newTotals.protein,
          total_carbs_g: newTotals.carbs,
          total_fat_g: newTotals.fat,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    setIsUpdating(true);
    try {
      await mealApi.deleteFoodEntry(id);
      
      // Update daily summary
      if (dailySummary) {
        const entryToDelete = dailySummary.entries.find(e => e.id === id);
        const updatedEntries = dailySummary.entries.filter(entry => entry.id !== id);
        
        if (entryToDelete) {
          setDailySummary({
            ...dailySummary,
            entries: updatedEntries,
            total_calories: dailySummary.total_calories - entryToDelete.calories,
            total_protein_g: dailySummary.total_protein_g - entryToDelete.protein_g,
            total_carbs_g: dailySummary.total_carbs_g - entryToDelete.carbs_g,
            total_fat_g: dailySummary.total_fat_g - entryToDelete.fat_g,
          });
        }
      }
      
      toast.success('Food entry deleted successfully!');
    } catch (err) {
      console.error('Failed to delete entry:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete entry');
    } finally {
      setIsUpdating(false);
    }
  };

  // Profile handlers
  const handleCreateProfile = async (data: CreateUserProfileRequest) => {
    setIsSubmitting(true);
    try {
      const response = await mealApi.createUserProfile(data);
      setProfile(response.profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateUserProfileRequest) => {
    setIsSubmitting(true);
    try {
      const response = await mealApi.updateUserProfile(data);
      setProfile(response.profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTracking = async (data: CreateProfileTrackingRequest) => {
    setIsSubmitting(true);
    try {
      const response = await mealApi.createProfileTracking(data);
      setLatestTracking(response.tracking);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Favorites handlers
  const handleCreateFavorite = async (data: CreateFavoriteFoodRequest) => {
    setIsSubmitting(true);
    try {
      const response = await mealApi.createFavoriteFood(data);
      setFavorites(prev => [response.favorite, ...prev]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFavorite = async (id: string, data: UpdateFavoriteFoodRequest) => {
    setIsSubmitting(true);
    try {
      const response = await mealApi.updateFavoriteFood(id, data);
      setFavorites(prev => prev.map(fav => fav.id === id ? response.favorite : fav));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    setIsUpdating(true);
    try {
      await mealApi.deleteFavoriteFood(id);
      setFavorites(prev => prev.filter(fav => fav.id !== id));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddFavoriteToLog = async (favoriteId: string, mealType: MealType) => {
    setIsSubmitting(true);
    try {
      const response = await mealApi.addFavoriteToLog(favoriteId, mealType);
      
      // Update daily summary with new entry
      if (dailySummary) {
        setDailySummary({
          ...dailySummary,
          entries: [...dailySummary.entries, response.entry],
          total_calories: dailySummary.total_calories + response.entry.calories,
          total_protein_g: dailySummary.total_protein_g + response.entry.protein_g,
          total_carbs_g: dailySummary.total_carbs_g + response.entry.carbs_g,
          total_fat_g: dailySummary.total_fat_g + response.entry.fat_g,
        });
      } else {
        await loadDailySummary();
      }
      
      // Update usage count in favorites
      setFavorites(prev => prev.map(fav => 
        fav.id === favoriteId 
          ? { ...fav, usage_count: fav.usage_count + 1, last_used_at: new Date().toISOString() }
          : fav
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group entries by meal type
  const entriesByMealType = dailySummary?.entries.reduce((acc: Record<MealType, FoodEntry[]>, entry) => {
    if (!acc[entry.meal_type]) {
      acc[entry.meal_type] = [];
    }
    acc[entry.meal_type].push(entry);
    return acc;
  }, {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  } as Record<MealType, FoodEntry[]>) || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  } as Record<MealType, FoodEntry[]>;

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Utensils className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Meal Tracker</h1>
              <p className="text-muted-foreground">
                Track your daily nutrition and reach your goals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isToday ? "default" : "outline"}
              onClick={handleToday}
              className="min-w-[120px]"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isToday ? 'Today' : format(selectedDate, 'MMM d')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Error Loading Data
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 hover:text-red-700"
                    onClick={loadAllData}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Daily Nutrition Summary */}
            <DailyNutritionSummary 
              summary={dailySummary} 
              isLoading={isLoadingSummary} 
            />

            {/* Quick Add Bar */}
            <QuickAddBar
              favorites={favorites}
              onAddFavoriteToLog={handleAddFavoriteToLog}
              onViewAllFavorites={() => {}}
              isLoading={isLoadingFavorites}
              isAdding={isSubmitting}
            />

            {/* Quick Meal Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
                const entries = entriesByMealType[mealType] || [];
                const totalCalories = entries.reduce((sum: number, entry: FoodEntry) => sum + entry.calories, 0);
                const config: Record<MealType, { icon: string; color: string }> = {
                  breakfast: { icon: '🍳', color: 'text-yellow-600' },
                  lunch: { icon: '🍽️', color: 'text-blue-600' },
                  dinner: { icon: '🍖', color: 'text-purple-600' },
                  snack: { icon: '🍿', color: 'text-green-600' },
                };

                return (
                  <Card key={mealType} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleAddEntry(mealType)}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{config[mealType].icon}</div>
                      <h3 className="font-medium capitalize mb-1">{mealType}</h3>
                      <div className="space-y-1">
                        <p className={`text-lg font-semibold ${config[mealType].color}`}>
                          {totalCalories} cal
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entries.length} {entries.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Meals Tab */}
          <TabsContent value="meals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Daily Meals</h2>
              <Button onClick={() => handleAddEntry('snack')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Food Entry
              </Button>
            </div>

            <div className="space-y-6">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
                <MealTypeSection
                  key={mealType}
                  mealType={mealType}
                  entries={entriesByMealType[mealType] || []}
                  onAddEntry={handleAddEntry}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <FavoriteFoodsList
              favorites={favorites}
              onCreateFavorite={handleCreateFavorite}
              onUpdateFavorite={handleUpdateFavorite}
              onDeleteFavorite={handleDeleteFavorite}
              onAddToLog={handleAddFavoriteToLog}
              isLoading={isLoadingFavorites}
              isSubmitting={isSubmitting}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileSetup
              profile={profile}
              latestTracking={latestTracking}
              onCreateProfile={handleCreateProfile}
              onUpdateProfile={handleUpdateProfile}
              onAddTracking={handleAddTracking}
              isSubmitting={isSubmitting}
            />
          </TabsContent>
        </Tabs>

        {/* Food Entry Form Modal */}
        <FoodEntryForm
          isOpen={showFoodForm}
          onClose={() => setShowFoodForm(false)}
          onSubmit={handleCreateEntry}
          onUpdate={editingEntry ? handleUpdateEntry : undefined}
          editingEntry={editingEntry}
          defaultMealType={defaultMealType}
          selectedDate={dateString}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}