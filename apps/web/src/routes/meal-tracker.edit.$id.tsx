import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealForm } from '@/components/meal-tracker/MealForm';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMeals } from '@/hooks/meal-tracker';
import { RequireAuth } from '../auth/components/AuthGuard';

export const Route = createFileRoute('/meal-tracker/edit/$id')({
  component: EditMealPage,
});

function EditMealPage() {
  return (
    <RequireAuth>
      <EditMealPageContent />
    </RequireAuth>
  );
}

function EditMealPageContent() {
  const navigate = useNavigate();
  const params = useParams({ from: '/meal-tracker/edit/$id' });
  const { data: mealsData } = useMeals();

  const editingMealId = params.id;
  const editingMeal = editingMealId && mealsData?.meals
    ? mealsData.meals.find((m) => m.id === editingMealId)
    : null;

  const handleClose = () => {
    navigate({ to: '/meal-tracker' });
  };

  if (!editingMeal) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Meal Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The meal you're trying to edit doesn't exist.
        </p>
        <Button onClick={handleClose}>
          Back to Meal Tracker
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">Edit Meal</h1>
          <p className="text-muted-foreground text-sm">
            {editingMeal.foodName}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Edit Meal Details</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <MealForm
            editingMealId={editingMealId}
            mealType={editingMeal.mealType}
            onClose={handleClose}
            isStandalone={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}