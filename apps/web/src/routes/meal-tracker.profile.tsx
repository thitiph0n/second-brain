import { createFileRoute } from '@tanstack/react-router';
import { ProfileForm } from '@/components/meal-tracker/ProfileForm';

function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile & Goal Setting</h1>
          <p className="text-muted-foreground mt-2">
            Set up your profile to calculate your daily calorie and macro targets based on your goals.
          </p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/meal-tracker/profile')({
  component: ProfilePage,
});
