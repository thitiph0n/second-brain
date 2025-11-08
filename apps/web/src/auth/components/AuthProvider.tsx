import { useEffect } from "react";
import { useAuth } from "../hooks";
import { initializeAuth, setupTokenRefresh } from "../utils";

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const { isAuthenticated } = useAuth();

	useEffect(() => {
		// Initialize auth state on app load
		initializeAuth();
	}, []);

	useEffect(() => {
		// Set up auto token refresh when authenticated
		if (isAuthenticated) {
			const intervalId = setupTokenRefresh();
			return () => clearInterval(intervalId);
		}
	}, [isAuthenticated]);

	return <>{children}</>;
}
