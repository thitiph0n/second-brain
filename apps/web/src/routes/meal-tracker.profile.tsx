import { createFileRoute } from '@tanstack/react-router';
import { ProfileForm } from '@/components/meal-tracker/ProfileForm';
import { RequireAuth } from '../auth/components/AuthGuard';

export const Route = createFileRoute('/meal-tracker/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
          <ProfileForm />
        </div>
      </div>
    </RequireAuth>
  );
}
