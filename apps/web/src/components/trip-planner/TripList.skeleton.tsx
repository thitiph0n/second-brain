import { Skeleton } from "@/components/ui/skeleton";

export function TripListSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-64" />
			</div>

			/* Stats Cards */
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="space-y-2">
						<div className="h-16 p-4 border rounded-lg">
							<Skeleton className="h-6 w-20" />
							<Skeleton className="h-8 w-16 mt-2" />
						</div>
					</div>
				))}
			</div>

			{/* Search and Filters */}
			<div className="p-4 border rounded-lg">
				<div className="flex flex-col sm:flex-row gap-4">
					<Skeleton className="h-10 flex-1" />
					<div className="flex gap-2">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-8 w-20" />
						))}
					</div>
				</div>
			</div>

			/* Trip Cards */
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className="space-y-2">
						<div className="h-64 p-4 border rounded-lg space-y-3">
							<div className="space-y-2">
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
							</div>
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-4 w-24" />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-4 w-32" />
								</div>
							</div>
							<div className="flex items-center justify-between pt-3">
								<Skeleton className="h-6 w-20" />
								<div className="flex gap-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}