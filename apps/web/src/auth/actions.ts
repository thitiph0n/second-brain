import type { AuthUser } from "./store";
import { useAuthStore } from "./store";

export function login(user: AuthUser, accessToken: string, refreshToken: string) {
	useAuthStore.getState().setLoading(true);
	try {
		useAuthStore.getState().login(user, accessToken, refreshToken);
	} catch (e) {
		const message = e instanceof Error ? e.message : "Login failed";
		useAuthStore.getState().setError(message);
	} finally {
		useAuthStore.getState().setLoading(false);
	}
}

export function logout() {
	useAuthStore.getState().logout();
}

export async function initiateGitHubLogin() {
	const { setLoading, setError } = useAuthStore.getState();

	setLoading(true);
	setError(null);

	try {
		// Make API call to get the OAuth URL
		const response = await fetch("/api/v1/auth/github/login", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to initiate OAuth login");
		}

		const data = await response.json();

		if (data.error) {
			throw new Error(data.error);
		}

		// Redirect to GitHub OAuth page
		window.location.href = data.url;
	} catch (e) {
		const message = e instanceof Error ? e.message : "Failed to initiate login";
		setError(message);
		setLoading(false);
	}
}

export async function refreshToken() {
	const { refreshToken: token, setLoading, setError, logout } = useAuthStore.getState();

	if (!token) {
		logout();
		return null;
	}

	setLoading(true);
	setError(null);

	try {
		const response = await fetch("/api/v1/auth/refresh", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ refreshToken: token }),
		});

		if (!response.ok) {
			throw new Error("Failed to refresh token");
		}

		const data = await response.json();
		useAuthStore.getState().login(data.user, data.accessToken, data.refreshToken);
		return data.accessToken;
	} catch (e) {
		const message = e instanceof Error ? e.message : "Token refresh failed";
		setError(message);
		logout(); // Clear invalid session
		return null;
	} finally {
		setLoading(false);
	}
}

export async function logoutUser() {
	const { setLoading, setError } = useAuthStore.getState();

	setLoading(true);
	try {
		await fetch("/api/v1/auth/logout", {
			method: "POST",
			credentials: "include",
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : "Logout failed";
		setError(message);
	} finally {
		useAuthStore.getState().logout();
		setLoading(false);
	}
}
