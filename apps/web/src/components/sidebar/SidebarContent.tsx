import { Link } from "@tanstack/react-router";
import { useAuth, useAuthActions } from "@/auth/hooks";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	LayoutDashboard,
	Ticket,
	StickyNote,
	CheckSquare,
	Palette,
	LogOut,
	User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavigationItem = {
	title: string;
	href: string;
	icon: any;
	disabled?: boolean;
};

type NavigationSection = {
	title: string;
	items: NavigationItem[];
};

const navigationItems: NavigationSection[] = [
	{
		title: "Main",
		items: [
			{
				title: "Dashboard",
				href: "/dashboard",
				icon: LayoutDashboard,
			},
		],
	},
	{
		title: "Tools",
		items: [
			{
				title: "Coupons",
				href: "/coupons",
				icon: Ticket,
			},
			{
				title: "Notes",
				href: "/dashboard",
				icon: StickyNote,
				disabled: true,
			},
			{
				title: "Todos",
				href: "/dashboard",
				icon: CheckSquare,
				disabled: true,
			},
			{
				title: "Drawings",
				href: "/dashboard",
				icon: Palette,
				disabled: true,
			},
		],
	},
];

interface SidebarContentProps {
	className?: string;
}

export function SidebarContent({ className }: SidebarContentProps) {
	const { user } = useAuth();
	const { logout } = useAuthActions();

	return (
		<div className={cn("flex h-full flex-col", className)}>
			<div className="flex-1 overflow-y-auto py-4">
				<div className="space-y-6 px-3">
					{navigationItems.map((section) => (
						<div key={section.title}>
							<h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
								{section.title}
							</h3>
							<div className="space-y-1">
								{section.items.map((item) => {
									const Icon = item.icon;
									return (
										<Link
											key={item.href}
											to={item.href}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
												item.disabled &&
													"cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
											)}
											onClick={(e) => item.disabled && e.preventDefault()}
										>
											<Icon className="h-4 w-4" />
											{item.title}
											{item.disabled && (
												<span className="ml-auto text-xs text-muted-foreground">Soon</span>
											)}
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>

			{user && (
				<div className="border-t p-4">
					<div className="flex items-center gap-3">
						<Link
							to="/profile"
							className="flex items-center gap-3 flex-1 min-w-0"
							title="View Profile"
						>
							<Avatar className="h-8 w-8">
								<AvatarImage src={user.avatarUrl} alt={user.name} />
								<AvatarFallback>
									<User className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate hover:text-primary transition-colors">
									{user.name}
								</p>
								<p className="text-xs text-muted-foreground truncate">{user.email}</p>
							</div>
						</Link>
						<Button variant="ghost" size="sm" onClick={logout} className="h-8 w-8 p-0">
							<LogOut className="h-4 w-4" />
							<span className="sr-only">Log out</span>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
