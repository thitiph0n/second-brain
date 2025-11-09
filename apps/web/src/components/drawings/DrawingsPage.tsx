import type { Drawing } from "@second-brain/types/drawing";
import { ChevronRight, FolderPlus, Home, Palette, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteDrawing } from "@/hooks/drawings/useDeleteDrawing";
import { useDrawings } from "@/hooks/drawings/useDrawings";
import { CreateDrawingDialog } from "./CreateDrawingDialog";
import { DrawingItemCard } from "./DrawingItemCard";
import { DrawingItemSkeleton } from "./DrawingItemSkeleton";

interface BreadcrumbItem {
	id: string;
	title: string;
}

export function DrawingsPage() {
	const navigate = useNavigate({ from: "/drawings" });
	const search = useSearch({ from: "/drawings/" });
	const currentFolderId = search.folderId || null;

	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [createType, setCreateType] = useState<"drawing" | "folder">("drawing");
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

	const {
		data: allDrawings,
		isLoading,
		isError,
		error,
		refetch,
	} = useDrawings({
		filters: {
			searchQuery: searchQuery || undefined,
		},
		enabled: !currentFolderId && !searchQuery,
	});

	const {
		data: currentFolderDrawings,
		isLoading: isFolderLoading,
		refetch: refetchFolder,
	} = useDrawings({
		filters: {
			parentId: currentFolderId || undefined,
		},
		enabled: currentFolderId !== null && !searchQuery,
	});

	const {
		data: searchResults,
		isLoading: isSearchLoading,
		refetch: refetchSearch,
	} = useDrawings({
		filters: {
			searchQuery: searchQuery || undefined,
		},
		enabled: !!searchQuery,
	});

	const drawings = searchQuery ? searchResults : currentFolderId ? currentFolderDrawings : allDrawings;
	const isLoadingDrawings = searchQuery ? isSearchLoading : currentFolderId ? isFolderLoading : isLoading;

	// Fetch breadcrumb path when folder changes
	useEffect(() => {
		if (currentFolderId) {
			const fetchPath = async () => {
				try {
					const response = await fetch(
						`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://2b.thitiphon.me" : "http://localhost:8787")}/api/v1/drawings/${currentFolderId}/path`,
						{
							headers: {
								Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth-storage") || "{}").state?.accessToken}`,
							},
						}
					);
					const data = await response.json();
					if (data.path) {
						setBreadcrumbs(data.path.map((d: Drawing) => ({ id: d.id, title: d.title })));
					}
				} catch (error) {
					console.error("Failed to fetch breadcrumb path:", error);
				}
			};
			fetchPath();
		} else {
			setBreadcrumbs([]);
		}
	}, [currentFolderId]);

	const { deleteDrawing } = useDeleteDrawing({
		onSuccess: () => {
			refetch();
			if (currentFolderId) {
				refetchFolder();
			}
			if (searchQuery) {
				refetchSearch();
			}
		},
	});

	const handleDeleteDrawing = (id: string) => {
		deleteDrawing(id);
	};

	const handleOpenCreateDialog = (type: "drawing" | "folder") => {
		setCreateType(type);
		setIsCreateDialogOpen(true);
	};

	const handleFolderClick = (folderId: string) => {
		navigate({
			to: "/drawings",
			search: { folderId },
		});
	};

	const handleBreadcrumbClick = (folderId: string | null) => {
		navigate({
			to: "/drawings",
			search: folderId ? { folderId } : {},
		});
	};

	const handleMove = () => {
		refetch();
		if (currentFolderId) {
			refetchFolder();
		}
		if (searchQuery) {
			refetchSearch();
		}
	};

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

				<nav className="flex items-center gap-2 text-sm mb-4 flex-wrap">
					{breadcrumbs.length === 0 ? (
						<div className="flex items-center gap-1 text-foreground font-medium">
							<Home className="h-4 w-4" />
							<span>Drawings</span>
						</div>
					) : (
						<>
							<button
								onClick={() => handleBreadcrumbClick(null)}
								className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
							>
								<Home className="h-4 w-4" />
								<span>Drawings</span>
							</button>
							{breadcrumbs.map((crumb, index) => (
								<div key={crumb.id} className="flex items-center gap-2">
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
									{index === breadcrumbs.length - 1 ? (
										<span className="text-foreground font-medium">{crumb.title}</span>
									) : (
										<button
											onClick={() => handleBreadcrumbClick(crumb.id)}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											{crumb.title}
										</button>
									)}
								</div>
							))}
						</>
					)}
				</nav>

				{isLoadingDrawings ? (
					<div className="flex flex-col gap-2">
						{Array.from({ length: 3 }).map((_, index) => (
							<DrawingItemSkeleton key={index} />
						))}
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
				) : drawings.length === 0 ? (
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
						{drawings.map((drawing) => (
							<DrawingItemCard
								key={drawing.id}
								drawing={drawing}
								onDelete={handleDeleteDrawing}
								onMove={handleMove}
								onFolderClick={handleFolderClick}
								isDeleting={false}
							/>
						))}
					</div>
				)}

				<CreateDrawingDialog
					open={isCreateDialogOpen}
					onOpenChange={setIsCreateDialogOpen}
					type={createType}
					parentId={currentFolderId || undefined}
					onSuccess={() => {
						refetch();
						if (currentFolderId) {
							refetchFolder();
						}
						if (searchQuery) {
							refetchSearch();
						}
					}}
				/>
			</div>
		</div>
	);
}
