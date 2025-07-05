import { useAuth } from '../hooks';
import { initiateGitHubLogin } from '../actions';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export function LoginButton() {
  const { isLoading } = useAuth();

  const handleLogin = () => {
    initiateGitHubLogin();
  };

  return (
    <Button onClick={handleLogin} disabled={isLoading} className="w-full">
      {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
    </Button>
  );
}

export function LoginCard() {
  const { error } = useAuth();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Sign in to access your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        <LoginButton />
      </CardContent>
    </Card>
  );
}
