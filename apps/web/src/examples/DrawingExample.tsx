import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDrawingCanvas } from "../components/drawing/ResponsiveDrawingCanvas";

interface Drawing {
	id: string;
	title: string;
	description?: string;
	type: string;
	createdAt: string;
}

function DrawingsPage() {
	const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

	const { data: drawings, isLoading } = useQuery<Drawing[]>({
		queryKey: ["drawings"],
		queryFn: async () => {
			const response = await fetch("/api/v1/drawing");
			if (!response.ok) {
				throw new Error("Failed to load drawings");
			}
			return response.json();
		},
	});

	const createNewDrawing = async () => {
		try {
			const response = await fetch("/api/v1/drawing", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: `Drawing ${(drawings?.length || 0) + 1}`,
					description: "A new drawing",
					type: "drawing",
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to create drawing");
			}

			const newDrawing = await response.json();
			setSelectedDrawingId(newDrawing.data.id);
			toast.success("Drawing created successfully");
		} catch (_error) {
			toast.error("Failed to create drawing");
		}
	};

	if (selectedDrawingId) {
		return (
			<div className="h-screen">
				<ResponsiveDrawingCanvas
					drawingId={selectedDrawingId}
					onExit={() => setSelectedDrawingId(null)}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold">Drawings</h1>
				<Button onClick={createNewDrawing}>Create New Drawing</Button>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center h-64">
					<div className="animate-pulse space-y-4">
						<div className="h-32 bg-gray-200 rounded dark:bg-gray-700 w-full"></div>
						<div className="space-y-2">
							<div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4"></div>
							<div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-1/2"></div>
						</div>
					</div>
				</div>
			) : drawings?.length ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{drawings.map((drawing) => (
						<Card key={drawing.id} className="cursor-pointer hover:shadow-md transition-shadow">
							<CardHeader>
								<CardTitle>{drawing.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									{drawing.description || "No description"}
								</p>
								<p className="text-xs text-muted-foreground">
									Created: {new Date(drawing.createdAt).toLocaleDateString()}
								</p>
								<Button className="w-full mt-4" onClick={() => setSelectedDrawingId(drawing.id)}>
									Edit Drawing
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>No drawings yet</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							Create your first drawing to get started with tldraw!
						</p>
						<Button onClick={createNewDrawing}>Create Your First Drawing</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default DrawingsPage;
