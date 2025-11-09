import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DrawingItemSkeleton() {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<div className="flex-shrink-0 flex items-center justify-center">
						<Skeleton className="h-8 w-8 rounded-md" />
					</div>

					<div className="flex-1 min-w-0 space-y-2">
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>

					<Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
				</div>
			</CardContent>
		</Card>
	);
}
