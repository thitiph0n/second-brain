import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import Header from "../components/Header";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";
import { SidebarProvider } from "../components/sidebar/SidebarProvider";
import { Sidebar } from "../components/sidebar/Sidebar";
import { BottomNav } from "../components/sidebar/BottomNav";
import { useAuth } from "../auth/hooks";
import { useSidebar } from "../components/sidebar/SidebarProvider";
import { cn } from "@/lib/utils";

function AppLayout() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="second-brain-ui-theme">
			<SidebarProvider>
				<Sidebar />
				<div className="flex flex-col min-h-screen">
					<Header />
					<MainContent>
						<Outlet />
					</MainContent>
					<BottomNav />
				</div>
				<Toaster />
				<TanStackRouterDevtools />
			</SidebarProvider>
		</ThemeProvider>
	);
}

function MainContent({ children }: { children: React.ReactNode }) {
	const { isOpen, isMobile } = useSidebar();

	return (
		<main
			className={cn(
				"flex-1 transition-[margin-left] duration-300 ease-in-out",
				"pb-16 md:pb-0",
				!isMobile && isOpen ? "md:ml-64" : "md:ml-0"
			)}
		>
			{children}
		</main>
	);
}

function LandingLayout() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="second-brain-ui-theme">
			<SidebarProvider>
				<div className="flex flex-col min-h-screen">
					<Header />
					<main className="flex-1">
						<Outlet />
					</main>
				</div>
			</SidebarProvider>
			<Toaster />
			<TanStackRouterDevtools />
		</ThemeProvider>
	);
}

function RootComponent() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();

	// Handle redirection for authenticated users visiting root
	useEffect(() => {
		if (isAuthenticated) {
			const currentPath = window.location.pathname;
			if (currentPath === "/") {
				navigate({ to: "/dashboard" });
			}
		}
	}, [isAuthenticated, navigate]);

	// Show loading while checking auth
	if (isLoading) {
		return (
			<ThemeProvider defaultTheme="system" storageKey="second-brain-ui-theme">
				<div className="min-h-screen bg-background flex items-center justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</ThemeProvider>
		);
	}

	// If authenticated, show app layout
	if (isAuthenticated) {
		return <AppLayout />;
	}

	// If not authenticated, show landing layout
	return <LandingLayout />;
}

export const Route = createRootRoute({
	component: RootComponent,
});
