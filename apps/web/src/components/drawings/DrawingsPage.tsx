import { FolderPlus, Palette, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteDrawing } from "@/hooks/drawings/useDeleteDrawing";
import { useDrawings } from "@/hooks/drawings/useDrawings";
import { CreateDrawingDialog } from "./CreateDrawingDialog";
import { DrawingItemCard } from "./DrawingItemCard";

export function DrawingsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [createType, setCreateType] = useState<"drawing" | "folder">("drawing");

	const {
		data: drawings,
		isLoading,
		isError,
		error,
		refetch,
	} = useDrawings({
		filters: {
			searchQuery,
		},
	});

	const { deleteDrawing } = useDeleteDrawing({
		onSuccess: () => {
			refetch();
		},
	});

	const handleDeleteDrawing = (id: string) => {
		deleteDrawing(id);
	};

	const handleOpenCreateDialog = (type: "drawing" | "folder") => {
		setCreateType(type);
		setIsCreateDialogOpen(true);
	};

	const filteredDrawings = drawings.filter((drawing) =>
		drawing.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center gap-3 mb-6">
					<Palette className="h-8 w-8" />
					<div>
						<h1 className="text-3xl font-bold">Drawings</h1>
						<p className="text-muted-foreground">Create and manage your drawings</p>
					</div>
				</div>

				<div className="mb-6 flex flex-col sm:flex-row gap-3">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search drawings..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8"
							/>
						</div>
					</div>
					<div className="flex gap-2">
						<Button onClick={() => handleOpenCreateDialog("folder")} variant="outline">
							<FolderPlus className="mr-2 h-4 w-4" />
							New Folder
						</Button>
						<Button onClick={() => handleOpenCreateDialog("drawing")}>
							<Plus className="mr-2 h-4 w-4" />
							New Drawing
						</Button>
					</div>
				</div>

				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-sm text-muted-foreground">Loading drawings...</p>
						</div>
					</div>
				) : isError ? (
					<div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted">
						<div className="text-center">
							<h3 className="text-lg font-medium text-destructive">Error loading drawings</h3>
							<p className="text-sm text-muted-foreground mb-4">
								{error instanceof Error ? error.message : "Failed to load drawings"}
							</p>
							<Button onClick={() => refetch()}>Try Again</Button>
						</div>
					</div>
				) : filteredDrawings.length === 0 ? (
					<div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted">
						<div className="text-center">
							<h3 className="text-lg font-medium">No drawings found</h3>
							<p className="text-sm text-muted-foreground">
								{searchQuery
									? "Try adjusting your search query"
									: "Get started by creating a new drawing"}
							</p>
							{!searchQuery && (
								<Button className="mt-4" onClick={() => handleOpenCreateDialog("drawing")}>
									<Plus className="mr-2 h-4 w-4" />
									Create Drawing
								</Button>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{filteredDrawings.map((drawing) => (
							<DrawingItemCard
								key={drawing.id}
								drawing={drawing}
								onDelete={handleDeleteDrawing}
								isDeleting={false}
							/>
						))}
					</div>
				)}

				<CreateDrawingDialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
					type={createType}
					onSuccess={() => {
						refetch();
					}}
				/>
			</div>
		</div>
	);
}
