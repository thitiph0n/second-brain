import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/Header";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider defaultTheme="system" storageKey="second-brain-ui-theme">
			<Header />
			<Outlet />
			<Toaster />
			<TanStackRouterDevtools />
		</ThemeProvider>
	),
});
