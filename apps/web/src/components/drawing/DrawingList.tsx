interface Drawing {
	id: string;
	title: string;
	content: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	isArchived: boolean;
}

import { DrawingCard } from "./DrawingCard";

interface DrawingListProps {
	drawings: Drawing[];
	isLoading?: boolean;
	isError?: boolean;
	onEditDrawing?: (drawing: Drawing) => void;
	onDeleteDrawing?: (id: string) => Promise<void>;
	isDeleting?: string; // ID of drawing being deleted
	className?: string;
}

export function DrawingList({
	drawings,
	isLoading = false,
	isError = false,
	onEditDrawing,
	onDeleteDrawing,
	isDeleting,
	className,
}: DrawingListProps) {
	if (isLoading) {
		return (
			<div className={`space-y-4 ${className}`}>
				{[0, 1, 2].map((skeletonId) => (
					<div key={`skeleton-${skeletonId}`} className="animate-pulse bg-card border rounded-lg p-4">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4"></div>
								<div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-1/2"></div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className={`text-center py-8 ${className}`}>
				<p className="text-muted-foreground">Failed to load drawings. Please try again.</p>
			</div>
		);
	}

	if (drawings.length === 0) {
		return (
			<div className={`text-center py-8 ${className}`}>
				<div className="space-y-3">
					<div className="text-4xl">🎨</div>
					<h3 className="font-medium">No drawings yet</h3>
					<p className="text-muted-foreground text-sm">Create your first drawing to get started!</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{drawings.map((drawing) => (
				<DrawingCard
					key={drawing.id}
					drawing={drawing}
					onEdit={onEditDrawing}
					onDelete={onDeleteDrawing}
					isDeleting={isDeleting === drawing.id}
				/>
			))}
		</div>
	);
}
