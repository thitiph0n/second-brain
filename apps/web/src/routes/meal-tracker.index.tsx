import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DailyDashboard } from '@/components/meal-tracker/DailyDashboard';
import { useUserProfile } from '@/hooks/meal-tracker';
import { RequireAuth } from '../auth/components/AuthGuard';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/meal-tracker/')({
  component: MealTrackerIndex,
});

function MealTrackerIndex() {
  return (
    <RequireAuth>
      <MealTrackerContent />
    </RequireAuth>
  );
}

function MealTrackerContent() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  console.log('MealTrackerIndex - profileLoading:', profileLoading, 'profile:', profile);

  // Show loading state while checking profile
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  // Show message if no profile exists
  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">No Profile Found</h1>
        <p className="text-muted-foreground mb-6">
          Please create your profile to get started with meal tracking.
        </p>
        <Button onClick={() => navigate({ to: '/meal-tracker/profile' })}>
          Create Profile
        </Button>
      </div>
    );
  }

  // Show daily dashboard if profile exists
  return <DailyDashboard />;
}