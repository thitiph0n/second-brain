import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../auth/components/AuthGuard';
import { MealTrackerPage } from '../components/meal';

export const Route = createFileRoute('/meal-tracker')({
  component: MealTrackerRoute,
});

function MealTrackerRoute() {
  return (
    <RequireAuth>
      <MealTrackerPage />
    </RequireAuth>
  );
}