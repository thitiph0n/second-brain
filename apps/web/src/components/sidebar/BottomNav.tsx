import { Link } from "@tanstack/react-router";
import { LayoutDashboard, StickyNote, Ticket, User, Utensils, Plane } from "lucide-react";
import { useAuth } from "@/auth/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavigationItem = {
	title: string;
	href:	string;
	icon: any;
	disabled?: boolean;
};

const bottomNavItems: NavigationItem[] = [
	{
		title: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Coupons",
		href: "/coupons",
		icon: Ticket,
	},
	{
		title: "Trips",
		href: "/trip-planner",
		icon: Plane,
	},
	{
		title: "Meals",
		href: "/meal-tracker",
		icon: Utensils,
	},
	{
		title: "Notes",
		href: "/notes",
		icon: StickyNote,
		disabled: true, // Hidden on mobile bottom nav
	},
];

interface BottomNavProps {
	className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	// Filter out disabled items and add profile
	const activeItems = bottomNavItems.filter((item) => !item.disabled);
	const totalItems = activeItems.length + 1; // +1 for profile

	return (
		<nav
			className={cn(
				"fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden",
				className,
			)}
		>
			<div
				className={cn("grid h-16 max-w-lg gap-1 px-2", {
					"grid-cols-2": totalItems === 2,
					"grid-cols-3": totalItems === 3,
					"grid-cols-4": totalItems === 4,
					"grid-cols-5": totalItems === 5,
				})}
			>
				{activeItems.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								"flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
								"text-muted-foreground",
							)}
							activeProps={{
								className: "text-foreground bg-accent",
							}}
						>
							<Icon className="h-5 w-5" />
							<span className="text-xs">{item.title}</span>
						</Link>
					);
				})}

				<Link
					to="/profile"
					className={cn(
						"flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
						"text-muted-foreground",
					)}
					activeProps={{
						className: "text-foreground bg-accent",
					}}
				>
					<div className="relative">
						<Avatar className="h-5 w-5">
							<AvatarImage src={user.avatarUrl} alt={user.name} />
							<AvatarFallback className="h-5 w-5">
								<User className="h-3 w-3" />
							</AvatarFallback>
						</Avatar>
					</div>
					<span className="text-xs">Profile</span>
				</Link>
			</div>
		</nav>
	);
}
