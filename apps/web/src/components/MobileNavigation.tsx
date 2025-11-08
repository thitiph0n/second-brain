import { Link } from "@tanstack/react-router";
import { Home, Menu, Ticket } from "lucide-react";
import { Button } from "./ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./ui/sheet";

interface MobileNavigationProps {
	isAuthenticated: boolean;
}

export function MobileNavigation({ isAuthenticated }: MobileNavigationProps) {
	if (!isAuthenticated) return null;

	return (
		<div className="md:hidden">
			<Sheet>
				<SheetTrigger asChild>
					<Button variant="ghost" size="sm" className="p-2">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle navigation menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-[280px] sm:w-[300px]">
					<SheetHeader>
						<SheetTitle>Navigation</SheetTitle>
						<SheetDescription>Access your tools and features</SheetDescription>
					</SheetHeader>
					<nav className="flex flex-col gap-4 mt-6">
						<Link
							to="/dashboard"
							className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<Home className="h-4 w-4" />
							Dashboard
						</Link>
						<Link
							to="/coupons"
							className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							<Ticket className="h-4 w-4" />
							Coupons
						</Link>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	);
}
