import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Mail, Settings, User, Activity } from "lucide-react";
import { useAuth, useAuthActions } from "@/auth/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/meal-tracker/ProfileForm";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const { user } = useAuth();
	const { logout } = useAuthActions();

	if (!user) {
		return null;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold mb-2">Profile</h1>
					<p className="text-muted-foreground">Manage your account settings</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							User Information
						</CardTitle>
						<CardDescription>Your account details and preferences</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={user.avatarUrl} alt={user.name} />
								<AvatarFallback>
									<User className="h-8 w-8" />
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className="text-lg font-semibold">{user.name}</h3>
								<p className="text-sm text-muted-foreground flex items-center gap-1">
									<Mail className="h-3 w-3" />
									{user.email}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Account Settings
						</CardTitle>
						<CardDescription>Manage your account preferences</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium">Account Status</h4>
								<p className="text-sm text-muted-foreground">Your current account status</p>
							</div>
							<Badge variant="default">Active</Badge>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium">Authentication</h4>
								<p className="text-sm text-muted-foreground">Connected via GitHub</p>
							</div>
							<Badge variant="outline">GitHub OAuth</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Meal Tracker Profile
						</CardTitle>
						<CardDescription>Set your nutrition goals and activity level</CardDescription>
					</CardHeader>
					<CardContent>
						<ProfileForm embedded />
					</CardContent>
				</Card>

				<div className="flex flex-col sm:flex-row gap-4">
					<Button
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => {
							window.location.href = "https://github.com/settings/applications";
						}}
					>
						<Settings className="h-4 w-4 mr-2" />
						Manage GitHub Permissions
					</Button>
					<Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
						<LogOut className="h-4 w-4 mr-2" />
						Sign Out
					</Button>
				</div>
			</div>
		</div>
	);
}
