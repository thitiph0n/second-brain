import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DrawingFormDataWithContent {
	title: string;
	description?: string;
	content: string;
}

interface CreateDrawingButtonProps {
	onCreate?: (data: DrawingFormDataWithContent) => Promise<void>;
	isCreating?: boolean;
	variant?: "default" | "outline" | "secondary" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	className?: string;
	children?: React.ReactNode;
}

export function CreateDrawingButton({
	onCreate,
	isCreating = false,
	variant = "default",
	size = "default",
	className,
	children = "Create Drawing",
}: CreateDrawingButtonProps) {
	const [isPending, setIsPending] = useState(false);

	const handleCreate = async () => {
		if (onCreate && !isCreating && !isPending) {
			try {
				setIsPending(true);
				// Create a default empty drawing
				const defaultDrawing: DrawingFormDataWithContent = {
					title: "New Drawing",
					description: "",
					content: "{}", // Empty JSON for now
				};
				await onCreate(defaultDrawing);
			} catch (error) {
				console.error("Failed to create drawing:", error);
			} finally {
				setIsPending(false);
			}
		}
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleCreate}
			disabled={isCreating || isPending}
			className={className}
		>
			{isCreating || isPending ? (
				<Loader2 className="h-4 w-4 animate-spin mr-2" />
			) : (
				<Plus className="h-4 w-4 mr-2" />
			)}
			{children}
		</Button>
	);
}
