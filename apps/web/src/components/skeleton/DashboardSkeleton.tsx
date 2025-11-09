import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				{/* Title skeleton */}
				<Skeleton className="h-10 w-32 mb-6" />

				{/* Cards grid skeleton */}
				<div className="grid gap-6 md:grid-cols-2">
					{/* Welcome card skeleton */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-24 mb-2" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center space-x-4 group">
								<Skeleton className="h-12 w-12 rounded-full" />
								<div className="flex-1 min-w-0 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-40" />
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Coupons card skeleton */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-20 mb-2" />
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex items-baseline gap-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-3 w-16" />
								</div>
								<Skeleton className="h-3 w-24" />
								<div className="flex gap-3">
									<Skeleton className="h-3 w-12" />
									<Skeleton className="h-3 w-10" />
								</div>
							</div>
							<Skeleton className="h-9 w-32 mt-4" />
						</CardContent>
					</Card>
				</div>

				{/* Coming Soon section skeleton */}
				<div className="mt-12">
					<Skeleton className="h-6 w-32 mb-4" />
					<div className="grid gap-4 md:grid-cols-2">
						<Card className="border-dashed border-muted-foreground/30 bg-muted/30">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Skeleton className="h-5 w-5" />
									<Skeleton className="h-5 w-16" />
								</div>
								<Skeleton className="h-4 w-64 mt-2" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-9 w-24" />
							</CardContent>
						</Card>

						<Card className="border-dashed border-muted-foreground/30 bg-muted/30">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Skeleton className="h-5 w-5" />
									<Skeleton className="h-5 w-16" />
								</div>
								<Skeleton className="h-4 w-64 mt-2" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-9 w-24" />
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
