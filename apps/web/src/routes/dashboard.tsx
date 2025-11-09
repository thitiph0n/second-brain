import type { Coupon } from "@second-brain/types/coupon";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, StickyNote, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/skeleton/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, couponApi } from "@/services/couponApi";
import { RequireAuth } from "../auth/components/AuthGuard";
import { useAuth } from "../auth/hooks";
import { DrawingsPanelCard } from "@/components/dashboard/DrawingsPanelCard";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<RequireAuth>
			<DashboardContent />
		</RequireAuth>
	);
}

function DashboardContent() {
	const { user } = useAuth();
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
	const [couponError, setCouponError] = useState<string | null>(null);

	// Load coupons for statistics
	useEffect(() => {
		async function loadCoupons() {
			try {
				setCouponError(null);
				const response = await couponApi.getCoupons();
				setCoupons(response.coupons);
			} catch (err) {
				console.error("Failed to load coupons:", err);
				setCouponError(err instanceof ApiError ? err.message : "Failed to load coupons");
			} finally {
				setIsLoadingCoupons(false);
			}
		}

		loadCoupons();
	}, []);

	// Calculate coupon statistics (API handles sorting)
	const activeCoupons = coupons.filter(
		(c) => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt) >= new Date()),
	);
	const expiredCoupons = coupons.filter(
		(c) => c.expiresAt && new Date(c.expiresAt) < new Date() && !c.isUsed,
	);
	const usedCoupons = coupons.filter((c) => c.isUsed);

	// Show skeleton while loading coupons
	if (isLoadingCoupons) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Dashboard</h1>
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Welcome back!</CardTitle>
							<CardDescription>
								Hello {user?.name}, here's your Second Brain overview.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link
								to="/profile"
								className="flex items-center space-x-4 group"
								title="View Profile"
							>
								<img
									src={user?.avatarUrl}
									alt={user?.name}
									className="h-12 w-12 rounded-full ring-2 ring-background group-hover:ring-primary/20 transition-all"
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
										{user?.name}
									</p>
									<p className="text-xs text-muted-foreground truncate">{user?.email}</p>
								</div>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Coupons</CardTitle>
							<CardDescription>Manage your coupon codes</CardDescription>
						</CardHeader>
						<CardContent>
							{couponError ? (
								<div className="space-y-2">
									<div className="text-2xl font-bold text-red-500">Error</div>
									<p className="text-xs text-red-600">{couponError}</p>
								</div>
							) : (
								<div className="space-y-2">
									<div className="flex items-baseline gap-2">
										<div className="text-2xl font-bold">{activeCoupons.length}</div>
										{coupons.length > 0 && (
											<span className="text-xs text-muted-foreground">
												of {coupons.length} total
											</span>
										)}
									</div>
									<p className="text-xs text-muted-foreground">Active coupons</p>
									{(expiredCoupons.length > 0 || usedCoupons.length > 0) && (
										<div className="flex gap-3 text-xs">
											{expiredCoupons.length > 0 && (
												<span className="text-orange-600">{expiredCoupons.length} expired</span>
											)}
											{usedCoupons.length > 0 && (
												<span className="text-green-600">{usedCoupons.length} used</span>
											)}
										</div>
									)}
								</div>
							)}
							<Link to="/coupons">
								<Button variant="outline" size="sm" className="mt-2">
									<Ticket className="h-4 w-4 mr-2" />
									Manage Coupons
								</Button>
							</Link>
						</CardContent>
					</Card>

					<DrawingsPanelCard />
				</div>

				{/* Upcoming Features Section */}
				<div className="mt-12">
					<h2 className="text-xl font-semibold mb-4 text-muted-foreground">Coming Soon</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-dashed border-muted-foreground/30 bg-muted/30">
							<CardHeader>
								<div className="flex items-center gap-2">
									<StickyNote className="h-5 w-5 text-muted-foreground" />
									<CardTitle className="text-muted-foreground">Notes</CardTitle>
								</div>
								<CardDescription className="text-muted-foreground/70">
									Capture and organize your thoughts with rich text editor and smart linking.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="ghost" size="sm" disabled className="text-muted-foreground/50">
									Coming Soon
								</Button>
							</CardContent>
						</Card>

						<Card className="border-dashed border-muted-foreground/30 bg-muted/30">
							<CardHeader>
								<div className="flex items-center gap-2">
									<CheckSquare className="h-5 w-5 text-muted-foreground" />
									<CardTitle className="text-muted-foreground">Todos</CardTitle>
								</div>
								<CardDescription className="text-muted-foreground/70">
									Manage your tasks with Eisenhower Matrix and smart prioritization.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="ghost" size="sm" disabled className="text-muted-foreground/50">
									Coming Soon
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
