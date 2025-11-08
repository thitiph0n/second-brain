import { Link } from "@tanstack/react-router";
import { LoginButton } from "../auth/components/LoginCard";
import { UserMenu } from "../auth/components/UserMenu";
import { useAuth } from "../auth/hooks";
import { MobileNavigation } from "./MobileNavigation";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
	const { isAuthenticated, isLoading } = useAuth();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center justify-between">
				<div className="flex items-center space-x-4">
					<MobileNavigation isAuthenticated={isAuthenticated} />
					<nav className="flex items-center space-x-4 lg:space-x-6">
						<Link
							to="/"
							className="text-lg font-semibold transition-colors hover:text-foreground/80"
						>
							Second Brain
						</Link>
						{isAuthenticated && (
							<div className="hidden md:flex items-center space-x-4 lg:space-x-6">
								<Link
									to="/dashboard"
									className="text-sm font-medium transition-colors hover:text-foreground/80 text-muted-foreground"
								>
									Dashboard
								</Link>
								<Link
									to="/coupons"
									className="text-sm font-medium transition-colors hover:text-foreground/80 text-muted-foreground"
								>
									Coupons
								</Link>
							</div>
						)}
					</nav>
				</div>
				<div className="flex items-center space-x-4">
					{!isLoading && <>{isAuthenticated ? <UserMenu /> : <LoginButton variant="icon" />}</>}
					<ModeToggle />
				</div>
			</div>
		</header>
	);
}
