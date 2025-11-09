export type DrawingType = "drawing" | "folder";

export interface Drawing {
	id: string;
	title: string;
	description?: string;
	userId: string;
	parentId?: string;
	type: DrawingType;
	data?: string; // JSON string containing Tldraw store data
	createdAt: string;
	updatedAt: string;
	isArchived?: boolean;
}

export interface DrawingFormData {
	title: string;
	description?: string;
	type?: DrawingType;
	parentId?: string;
	isArchived?: boolean;
}

export interface DrawingFormDataWithContent extends DrawingFormData {
	content?: string;
	data?: string;
}

export interface CreateDrawingRequest {
	title: string;
	description?: string;
	type?: DrawingType;
	parentId?: string;
	data?: string;
}

export interface UpdateDrawingRequest {
	title?: string;
	description?: string | null;
	parentId?: string;
	data?: string;
	isArchived?: boolean;
}

export interface DrawingListProps {
	drawings: Drawing[];
	isLoading?: boolean;
	isError?: boolean;
	onCreateDrawing?: (data: DrawingFormDataWithContent) => Promise<void>;
	onDeleteDrawing?: (id: string) => Promise<void>;
	onUpdateDrawing?: (id: string, data: Partial<UpdateDrawingRequest>) => Promise<void>;
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
}

export interface DrawingHeaderProps {
	title?: string;
	saving?: boolean;
	onSave?: () => Promise<void>;
	onCancel?: () => void;
	onDelete?: () => Promise<void>;
	deleting?: boolean;
}

export interface DrawingAsset {
	id: string;
	drawingId?: string;
	userId: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	url: string;
	storageType: string;
	base64Data?: string;
	createdAt: string;
	updatedAt: string;
}
