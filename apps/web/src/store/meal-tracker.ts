// UI state management for Meal Tracker (now using API via TanStack Query)
import { create } from 'zustand';
import type { MealType } from '@/types/meal-tracker';

interface MealTrackerState {
  // UI state only - all data now comes from API via TanStack Query
  showMealForm: boolean;
  editingMealId: string | null;
  selectedMealType: MealType;
  selectedFavoriteId: string | null;

  // UI actions
  setShowMealForm: (show: boolean) => void;
  setEditingMeal: (id: string | null, mealType?: MealType) => void;
  setSelectedFavorite: (id: string | null) => void;
}

export const useMealTracker = create<MealTrackerState>((set) => ({
  // Initial UI state
  showMealForm: false,
  editingMealId: null,
  selectedMealType: 'breakfast',
  selectedFavoriteId: null,

  // UI actions
  setShowMealForm: (show: boolean) => set({ showMealForm: show }),
  setEditingMeal: (id: string | null, mealType?: MealType) => set({
    editingMealId: id,
    selectedMealType: mealType || 'breakfast',
    showMealForm: id !== null
  }),
  setSelectedFavorite: (id: string | null) => set({ selectedFavoriteId: id }),
}));
