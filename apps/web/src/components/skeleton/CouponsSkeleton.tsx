import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CouponsSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				{/* Page header skeleton */}
				<div className="flex items-center gap-3 mb-6">
					<Skeleton className="h-8 w-8" />
					<div className="space-y-2">
						<Skeleton className="h-10 w-40" />
						<Skeleton className="h-4 w-64" />
					</div>
				</div>

				{/* Form card skeleton */}
				<Card className="mb-6">
					<CardHeader>
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-12" />
									<Skeleton className="h-10 w-full" />
								</div>
							</div>
							<Skeleton className="h-10 w-24" />
						</div>
					</CardContent>
				</Card>

				{/* Controls section skeleton */}
				<div className="mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-2 flex-wrap">
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-6 w-24 rounded-full" />
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-8 w-16" />
						</div>
					</div>
				</div>

				{/* Tabs skeleton */}
				<div className="flex space-x-1 mb-6">
					<Skeleton className="h-10 w-20" />
					<Skeleton className="h-10 w-20" />
					<Skeleton className="h-10 w-32" />
				</div>

				{/* Coupon items skeleton */}
				<div className="space-y-4">
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center gap-3 flex-1">
								<Skeleton className="h-5 w-5" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-24" />
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-6 w-16 rounded-full" />
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
