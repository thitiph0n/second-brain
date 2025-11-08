import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { initiateGitHubLogin } from "../actions";
import { useAuth } from "../hooks";

interface LoginButtonProps {
	variant?: "full" | "icon";
}

export function LoginButton({ variant = "full" }: LoginButtonProps) {
	const { isLoading } = useAuth();
	const [isSigningIn, setIsSigningIn] = useState(false);

	// Check if we were in the middle of signing in when the page loaded
	useEffect(() => {
		const wasSigningIn = sessionStorage.getItem("auth_loading") === "true";
		if (wasSigningIn) {
			setIsSigningIn(true);
			// Clear the flag after a timeout to prevent infinite loading
			setTimeout(() => {
				sessionStorage.removeItem("auth_loading");
				setIsSigningIn(false);
			}, 5000);
		}
	}, []);

	const handleLogin = async () => {
		setIsSigningIn(true);
		sessionStorage.setItem("auth_loading", "true");
		await initiateGitHubLogin();
	};

	const loading = isLoading || isSigningIn;

	if (variant === "icon") {
		return (
			<Button
				onClick={handleLogin}
				disabled={loading}
				size="icon"
				variant="ghost"
				title="Sign in with GitHub"
			>
				{loading ? (
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
				) : (
					<GitHubIcon />
				)}
			</Button>
		);
	}

	return (
		<Button
			onClick={handleLogin}
			disabled={loading}
			className="w-full flex items-center justify-center gap-2"
		>
			{loading ? (
				<>
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					Signing in...
				</>
			) : (
				<>
					<GitHubIcon />
					Sign in with GitHub
				</>
			)}
		</Button>
	);
}

function GitHubIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
		</svg>
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
