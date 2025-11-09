import { z } from "zod";

export const drawingTypeSchema = z.enum(["drawing", "folder"]);

export const createDrawingSchema = z.object({
	title: z
		.string()
		.min(1, "Drawing title is required")
		.max(100, "Drawing title must be less than 100 characters"),
	description: z.string().max(500, "Description must be less than 500 characters").optional(),
	type: drawingTypeSchema.default("drawing"),
	parentId: z.string().uuid().optional(),
	data: z.string().optional(),
});

export const updateDrawingSchema = z.object({
	title: z
		.string()
		.min(1, "Drawing title is required")
		.max(100, "Drawing title must be less than 100 characters")
		.optional(),
	description: z.string().max(500, "Description must be less than 500 characters").nullable().optional(),
	parentId: z.string().uuid().nullable().optional(),
	data: z.string().optional(),
});

export const bulkDeleteDrawingSchema = z.object({
	ids: z
		.array(z.string().uuid())
		.min(1, "At least one drawing ID is required")
		.max(100, "Cannot delete more than 100 drawings at once"),
});

export type CreateDrawingRequest = z.infer<typeof createDrawingSchema>;
export type UpdateDrawingRequest = z.infer<typeof updateDrawingSchema>;
export type BulkDeleteDrawingRequest = z.infer<typeof bulkDeleteDrawingSchema>;
