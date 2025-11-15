import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useMealTracker } from '@/store/meal-tracker';
import { DailyDashboard } from '@/components/meal-tracker/DailyDashboard';

function MealTrackerPage() {
  const profile = useMealTracker((state) => state.profile);

  // Redirect to profile setup if no profile exists
  if (!profile) {
    return <Navigate to="/meal-tracker/profile" />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DailyDashboard />
    </div>
  );
}

export const Route = createFileRoute('/meal-tracker')({
  component: MealTrackerPage,
});
