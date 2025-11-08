import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/error")({
	component: AuthError,
});

function AuthError() {
	const router = useRouter();

	useEffect(() => {
		// Clear any stored redirect URL since auth failed
		sessionStorage.removeItem("auth_redirect");
		// Clear loading flag
		sessionStorage.removeItem("auth_loading");
	}, []);

	const handleRetry = () => {
		router.navigate({ to: "/" });
	};

	// Get error message from URL params
	const urlParams = new URLSearchParams(window.location.search);
	const error = urlParams.get("error") || "Authentication failed";

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center space-y-4 max-w-md">
				<div className="text-red-500 text-6xl">⚠️</div>
				<h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
				<p className="text-gray-600">{decodeURIComponent(error)}</p>
				<button
					type="button"
					onClick={handleRetry}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
				>
					Return to Home
				</button>
			</div>
		</div>
	);
}
