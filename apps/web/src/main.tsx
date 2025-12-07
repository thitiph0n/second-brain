import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./auth/components/AuthProvider";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";

// Create a QueryClient instance
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

// Expose queryClient on window for debugging
if (typeof window !== "undefined") {
	(window as any).__queryClient = queryClient;

	// Register Service Worker
	if ("serviceWorker" in navigator && import.meta.env.MODE === "production") {
		window.addEventListener("load", () => {
			navigator.serviceWorker.register("/sw.js").then(
				(registration) => {
					console.log("SW registered: ", registration);
				},
				(registrationError) => {
					console.log("SW registration failed: ", registrationError);
				}
			);
		});
	}
}

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
}
