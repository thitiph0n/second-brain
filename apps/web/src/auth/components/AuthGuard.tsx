import { useAuth } from "../hooks";

interface AuthGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return fallback || null;
	}

	return <>{children}</>;
}

interface RequireAuthProps {
	children: React.ReactNode;
	loginComponent?: React.ReactNode;
}

export function RequireAuth({ children, loginComponent }: RequireAuthProps) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				{loginComponent || <div>Please sign in to continue</div>}
			</div>
		);
	}

	return <>{children}</>;
}
