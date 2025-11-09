export interface Drawing {
	id: string;
	title: string;
	content: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	isArchived: boolean;
}

export interface DrawingFormData {
	title: string;
	description?: string;
}

export interface DrawingFormDataWithContent extends DrawingFormData {
	content: string;
}

export interface DrawingListProps {
	drawings: Drawing[];
	isLoading?: boolean;
	isError?: boolean;
	onCreateDrawing?: (data: DrawingFormDataWithContent) => Promise<void>;
	onDeleteDrawing?: (id: string) => Promise<void>;
	onUpdateDrawing?: (id: string, data: Partial<DrawingFormDataWithContent>) => Promise<void>;
	onEditDrawing?: (drawing: Drawing) => void;
}

export interface DrawingCardProps {
	drawing: Drawing;
	onEdit?: (drawing: Drawing) => void;
	onDelete?: (id: string) => Promise<void>;
	isDeleting?: boolean;
}

export interface CreateDrawingButtonProps {
	onCreate?: (data: DrawingFormDataWithContent) => Promise<void>;
	isCreating?: boolean;
	variant?: "default" | "outline" | "secondary" | "ghost";
	size?: "default" | "sm" | "lg" | "icon";
	className?: string;
	children?: React.ReactNode;
}

export interface DrawingHeaderProps {
	title?: string;
	description?: string;
	saving?: boolean;
	onSave?: () => Promise<void>;
	onCancel?: () => void;
	onDelete?: () => Promise<void>;
	onTitleChange?: (title: string) => void;
	onDescriptionChange?: (description: string) => void;
	deleting?: boolean;
	editable?: boolean;
	className?: string;
}

// Legacy types for existing components
export interface DrawingItem {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface DrawingDocument {
	id: string;
	name: string;
	boards: {
		shapeTypes: string[];
		hydrated: boolean;
		schema: string;
	};
	document: {
		documentId: string;
		assets: Record<string, any>;
		gridSize: number;
		nonce: string;
	};
	schema: string;
	json: string;
}
