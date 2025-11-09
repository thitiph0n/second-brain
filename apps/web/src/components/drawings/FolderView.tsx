import type { Drawing } from "@second-brain/types/drawing";
import { ChevronRight, FolderPlus, Home, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDrawings } from "@/hooks/drawings/useDrawings";
import { useDeleteDrawing } from "@/hooks/drawings/useDeleteDrawing";
import { useDrawing } from "@/hooks/drawings/useDrawing";
import { CreateDrawingDialog } from "./CreateDrawingDialog";
import { DrawingItemCard } from "./DrawingItemCard";

interface FolderViewProps {
	folderId: string;
	folderName: string;
}

interface BreadcrumbItem {
	id: string;
	title: string;
}

export function FolderView({ folderId, folderName }: FolderViewProps) {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [createType, setCreateType] = useState<"drawing" | "folder">("drawing");
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

	const { data: currentFolder } = useDrawing(folderId);
	const { data: allDrawings } = useDrawings();

	useEffect(() => {
		if (currentFolder && allDrawings) {
			const buildBreadcrumbs = (folder: Drawing): BreadcrumbItem[] => {
				const crumbs: BreadcrumbItem[] = [];
				let current: Drawing | undefined = folder;

				while (current) {
					crumbs.unshift({ id: current.id, title: current.title });
					if (current.parentId) {
						current = allDrawings.find((d) => d.id === current?.parentId);
					} else {
						break;
					}
				}

				return crumbs;
			};

			setBreadcrumbs(buildBreadcrumbs(currentFolder));
		}
	}, [currentFolder, allDrawings]);

	const {
		data: drawings,
		isLoading,
		isError,
		error,
		refetch,
	} = useDrawings({
		filters: {
			parentId: folderId,
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

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<nav className="flex items-center gap-2 text-sm mb-3 flex-wrap">
						<Link
							to="/drawings"
							className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
						>
							<Home className="h-4 w-4" />
							<span>Drawings</span>
						</Link>
						{breadcrumbs.map((crumb, index) => (
							<div key={crumb.id} className="flex items-center gap-2">
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
								{index === breadcrumbs.length - 1 ? (
									<span className="text-foreground font-medium">{crumb.title}</span>
								) : (
									<Link
										to="/drawings/$id"
										params={{ id: crumb.id }}
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										{crumb.title}
									</Link>
								)}
							</div>
						))}
					</nav>
					<h1 className="text-3xl font-bold">{folderName}</h1>
				</div>

				<div className="mb-6 flex gap-2">
					<Button onClick={() => handleOpenCreateDialog("folder")} variant="outline">
						<FolderPlus className="mr-2 h-4 w-4" />
						New Folder
					</Button>
					<Button onClick={() => handleOpenCreateDialog("drawing")}>
						<Plus className="mr-2 h-4 w-4" />
						New Drawing
					</Button>
				</div>

				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-sm text-muted-foreground">Loading folder contents...</p>
						</div>
					</div>
				) : isError ? (
					<div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted">
						<div className="text-center">
							<h3 className="text-lg font-medium text-destructive">Error loading folder</h3>
							<p className="text-sm text-muted-foreground mb-4">
								{error instanceof Error ? error.message : "Failed to load folder"}
							</p>
							<Button onClick={() => refetch()}>Try Again</Button>
						</div>
					</div>
				) : drawings.length === 0 ? (
					<div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted">
						<div className="text-center">
							<h3 className="text-lg font-medium">This folder is empty</h3>
							<p className="text-sm text-muted-foreground">
								Get started by creating a new drawing or folder
							</p>
							<div className="flex gap-2 justify-center mt-4">
								<Button variant="outline" onClick={() => handleOpenCreateDialog("folder")}>
									<FolderPlus className="mr-2 h-4 w-4" />
									New Folder
								</Button>
								<Button onClick={() => handleOpenCreateDialog("drawing")}>
									<Plus className="mr-2 h-4 w-4" />
									New Drawing
								</Button>
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{drawings.map((drawing) => (
							<DrawingItemCard
								key={drawing.id}
								drawing={drawing}
								onDelete={handleDeleteDrawing}
								onMove={() => refetch()}
								isDeleting={false}
							/>
						))}
					</div>
				)}

				<CreateDrawingDialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
					type={createType}
					parentId={folderId}
					onSuccess={() => {
						refetch();
					}}
				/>
			</div>
		</div>
	);
}
