import type { AuthSession, User } from "@second-brain/types/auth";
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { DrawingService } from "../services/drawing";
import {
	createAuthErrorResponse,
	createErrorResponse,
	createNotFoundErrorResponse,
	createValidationErrorResponse,
} from "../utils/errorHandler";
import {
	bulkDeleteDrawingSchema,
	createDrawingSchema,
	updateDrawingSchema,
} from "../validation/drawing";

interface Env {
	DB: D1Database;
	CACHE: KVNamespace;
	JWT_SECRET: string;
	FRONTEND_URL: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
}

const drawingRoutes = new Hono<{
	Bindings: Env;
	Variables: { user: User; session: AuthSession };
}>();

// Apply auth middleware to all drawing routes
drawingRoutes.use("*", requireAuth());

// GET /api/v1/drawings - Get all drawings for the authenticated user
drawingRoutes.get("/", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const drawingService = new DrawingService(c.env.DB);
		const drawings = await drawingService.getDrawingsByUser(user.id);

		return c.json({ drawings });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch drawings");
	}
});

// GET /api/v1/drawings/folder/:parentId - Get drawings in a specific folder
drawingRoutes.get("/folder/:parentId", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const parentId = c.req.param("parentId");

		const drawingService = new DrawingService(c.env.DB);
		const drawings = await drawingService.getDrawingsByFolder(user.id, parentId);

		return c.json({ drawings });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch drawings in folder", 500, {
			parentId: c.req.param("parentId"),
		});
	}
});

// POST /api/v1/drawings - Create a new drawing
drawingRoutes.post("/", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();

		// Validate request body
		const validatedData = createDrawingSchema.parse(body);

		const drawingService = new DrawingService(c.env.DB);
		const drawing = await drawingService.createDrawing(user.id, validatedData);

		return c.json({ drawing }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to create drawing");
	}
});

// GET /api/v1/drawings/:id - Get a specific drawing
drawingRoutes.get("/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");

		const drawingService = new DrawingService(c.env.DB);
		const drawing = await drawingService.getDrawingById(id, user.id);

		if (!drawing) {
			return createNotFoundErrorResponse(c, "Drawing", id);
		}

		return c.json({ drawing });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch drawing", 500, {
			drawingId: c.req.param("id"),
		});
	}
});

// PATCH /api/v1/drawings/:id - Update a drawing
drawingRoutes.patch("/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");
		const body = await c.req.json();

		// Validate request body
		const validatedData = updateDrawingSchema.parse(body);

		const drawingService = new DrawingService(c.env.DB);
		const updatedDrawing = await drawingService.updateDrawing(id, user.id, validatedData);

		if (!updatedDrawing) {
			return createNotFoundErrorResponse(c, "Drawing", id);
		}

		return c.json({ drawing: updatedDrawing });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to update drawing", 500, {
			drawingId: c.req.param("id"),
		});
	}
});

// DELETE /api/v1/drawings/:id - Delete a drawing with cascade delete
drawingRoutes.delete("/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");

		const drawingService = new DrawingService(c.env.DB);
		const deleted = await drawingService.deleteDrawing(id, user.id);

		if (!deleted) {
			return createNotFoundErrorResponse(c, "Drawing", id);
		}

		return c.json({ message: "Drawing deleted successfully" });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to delete drawing", 500, {
			drawingId: c.req.param("id"),
		});
	}
});

// POST /api/v1/drawings/bulk-delete - Delete multiple drawings
drawingRoutes.post("/bulk-delete", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();

		// Validate request body
		const validatedData = bulkDeleteDrawingSchema.parse(body);

		const drawingService = new DrawingService(c.env.DB);
		const deletedCount = await drawingService.bulkDeleteDrawings(validatedData.ids, user.id);

		return c.json({
			message: `Successfully deleted ${deletedCount} drawing(s)`,
			deletedCount,
			requestedCount: validatedData.ids.length,
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to bulk delete drawings");
	}
});

export default drawingRoutes;
