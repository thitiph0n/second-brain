import { createFileRoute, Outlet } from '@tanstack/react-router';
import { RequireAuth } from '../auth/components/AuthGuard';

export const Route = createFileRoute('/meal-tracker')({
  component: MealTrackerPage,
});

function MealTrackerPage() {
  return (
    <RequireAuth>
      <MealTrackerContent />
    </RequireAuth>
  );
}

function MealTrackerContent() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Outlet />
    </div>
  );
}
