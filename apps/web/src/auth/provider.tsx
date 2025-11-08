import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { AuthState, User } from "./context";
import { AuthContext } from "./context";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [authState, setAuthState] = useState<AuthState>({
		isAuthenticated: false,
		isLoading: true,
		user: null,
		error: null,
	});

	const fetchUser = useCallback(async () => {
		try {
			const response = await fetch("/api/v1/auth/me");
			if (response.ok) {
				const user: User = await response.json();
				setAuthState({
					isAuthenticated: true,
					isLoading: false,
					user,
					error: null,
				});
			} else {
				setAuthState({
					isAuthenticated: false,
					isLoading: false,
					user: null,
					error: null,
				});
			}
		} catch (_error) {
			setAuthState({
				isAuthenticated: false,
				isLoading: false,
				user: null,
				error: "An unexpected error occurred.",
			});
		}
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	const logout = async () => {
		try {
			await fetch("/api/v1/auth/logout", { method: "POST" });
			setAuthState({
				isAuthenticated: false,
				isLoading: false,
				user: null,
				error: null,
			});
		} catch (_error) {
			setAuthState({
				isAuthenticated: false,
				isLoading: false,
				user: null,
				error: "Logout failed.",
			});
		}
	};

	return <AuthContext.Provider value={{ ...authState, logout }}>{children}</AuthContext.Provider>;
};
