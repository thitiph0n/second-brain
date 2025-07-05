import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '../auth/hooks';
import { handleOAuthCallback } from '../auth/utils';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const { isLoading } = useAuth();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
