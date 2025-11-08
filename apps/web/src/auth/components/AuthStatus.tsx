import { useAuth } from "../hooks";

export function LoadingSpinner() {
	return (
		<div className="flex items-center justify-center p-4">
			<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
		</div>
	);
}

export function AuthStatus() {
	const { user, isAuthenticated, isLoading, error } = useAuth();

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return (
			<div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
				{error}
			</div>
		);
	}

	if (isAuthenticated && user) {
		return (
			<div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
				Signed in as {user.name}
			</div>
		);
	}

	return (
		<div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
			Not signed in
		</div>
	);
}
