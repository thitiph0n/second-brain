import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../auth/hooks";
import { useAuthStore } from "../auth/store";

export const Route = createFileRoute("/auth/success")({
	component: AuthSuccess,
});

function AuthSuccess() {
	const router = useRouter();
	const { isLoading } = useAuth();
	const { login } = useAuthStore();

	useEffect(() => {
		const handleAuthSuccess = () => {
			// Clear any loading flags
			sessionStorage.removeItem("auth_loading");

			const urlParams = new URLSearchParams(window.location.search);
			const token = urlParams.get("token");
			const refreshToken = urlParams.get("refresh_token");
			const userParam = urlParams.get("user");

			if (token && refreshToken && userParam) {
				try {
					const user = JSON.parse(userParam);

					// Use the login method from auth store
					login(
						{
							id: user.id,
							name: user.name,
							email: user.email,
							avatarUrl: user.avatar_url,
						},
						token,
						refreshToken,
					);

					// Clear URL parameters
					window.history.replaceState({}, "", window.location.pathname);

					// Redirect to intended destination or dashboard
					const redirectTo = sessionStorage.getItem("auth_redirect") || "/dashboard";
					sessionStorage.removeItem("auth_redirect");

					router.navigate({ to: redirectTo });
				} catch (error) {
					console.error("Failed to parse user data:", error);
					window.location.href = "/auth/error?error=Invalid+user+data";
				}
			} else {
				console.error("Missing authentication parameters");
				window.location.href = "/auth/error?error=Missing+authentication+parameters";
			}
		};

		handleAuthSuccess();
	}, [router, login]);

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
				<p className="text-green-600 mb-2">Authentication successful!</p>
				<p className="text-gray-600">Redirecting to dashboard...</p>
			</div>
		</div>
	);
}
