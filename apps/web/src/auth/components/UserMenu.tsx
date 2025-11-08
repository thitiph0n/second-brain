import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { logoutUser } from "../actions";
import { useAuth } from "../hooks";

export function UserMenu() {
	const { user, isLoading } = useAuth();

	if (!user) return null;

	const handleLogout = () => {
		logoutUser();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8">
						<AvatarImage src={user.avatarUrl} alt={user.name} />
						<AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<div className="flex items-center justify-start gap-2 p-2">
					<div className="flex flex-col space-y-1 leading-none">
						<p className="font-medium">{user.name}</p>
						{user.email && (
							<p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
						)}
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer" onSelect={handleLogout} disabled={isLoading}>
					{isLoading ? "Signing out..." : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
