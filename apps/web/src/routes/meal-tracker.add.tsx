import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealForm } from '@/components/meal-tracker/MealForm';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { RequireAuth } from '../auth/components/AuthGuard';
import type { MealType } from '@/types/meal-tracker';

export const Route = createFileRoute('/meal-tracker/add')({
  component: AddMealPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mealType: (search.mealType as string) || 'breakfast',
  }),
});

function AddMealPage() {
  return (
    <RequireAuth>
      <AddMealPageContent />
    </RequireAuth>
  );
}

function AddMealPageContent() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/meal-tracker/add' });

  const handleClose = () => {
    navigate({ to: '/meal-tracker' });
  };

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
          <h1 className="text-2xl font-bold truncate">Log Meal</h1>
          <p className="text-muted-foreground text-sm">
            Add a new meal to your tracker
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">New Meal</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <MealForm
            mealType={search.mealType as MealType}
            onClose={handleClose}
            isStandalone={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}