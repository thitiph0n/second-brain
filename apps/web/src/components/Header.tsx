import { Link } from "@tanstack/react-router";
import { LoginButton } from "../auth/components/LoginCard";
import { useAuth } from "../auth/hooks";
import { ModeToggle } from "./mode-toggle";
import { SidebarToggle } from "./sidebar/SidebarToggle";

export default function Header() {
	const { isAuthenticated, isLoading } = useAuth();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center justify-between">
				<div className="flex items-center space-x-4">
					{isAuthenticated && (
						<div className="hidden md:block">
							<SidebarToggle />
						</div>
					)}
					<nav className="flex items-center space-x-4 lg:space-x-6">
						<Link
							to={isAuthenticated ? "/dashboard" : "/"}
							className="text-lg font-semibold transition-colors hover:text-foreground/80"
						>
							Second Brain
						</Link>
					</nav>
				</div>
				<div className="flex items-center space-x-4">
					{!isLoading && <>{isAuthenticated ? null : <LoginButton variant="icon" />}</>}
					<ModeToggle />
				</div>
			</div>
		</header>
	);
}
