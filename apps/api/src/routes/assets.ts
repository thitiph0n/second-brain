import { zValidator } from "@hono/zod-validator";
import { type Context, Hono, type Next } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { DrawingService } from "../services/drawing";
import {
	createErrorResponse,
	createNotFoundErrorResponse,
	createValidationErrorResponse,
} from "../utils/errorHandler";
import {
	createDrawingAssetsR2,
	generateDrawingAssetKey,
	getContentTypeFromFilename,
	isValidDrawingFileExtension,
} from "../utils/r2";

interface Env {
	DB: D1Database;
	CACHE: KVNamespace;
	DRAWING_ASSETS: R2Bucket;
	ENVIRONMENT: string;
	FRONTEND_URL: string;
	JWT_SECRET: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
}

interface UploadProgress {
	uploadedBytes: number;
	totalBytes: number;
	percentage: number;
}

const assetsRoutes = new Hono<{
	Bindings: Env;
	Variables: { user: any; uploadProgress?: UploadProgress };
}>();

// Progress tracking middleware
function trackUploadProgress() {
	return async (c: Context<{ Bindings: Env; Variables: any }>, next: Next) => {
		if (c.req.method === "POST" && c.req.header("Content-Type")?.includes("multipart/form-data")) {
			const contentLength = c.req.header("Content-Length");
			if (contentLength) {
				const totalBytes = parseInt(contentLength, 10);
				c.set("uploadProgress", {
					uploadedBytes: 0,
					totalBytes,
					percentage: 0,
				});
			}
		}
		await next();
	};
}

// File upload validation schema
const uploadSchema = z.object({
	file: z.instanceof(File),
	drawingId: z.string().optional(),
});

// Asset metadata query schema
const getAssetSchema = z.object({
	id: z.string(),
});

// Delete asset schema
const deleteAssetSchema = z.object({
	id: z.string(),
});

// List assets schema
const listAssetsSchema = z.object({
	drawingId: z.string(),
});

// Upload file with R2 fallback to base64
assetsRoutes.post(
	"/upload",
	trackUploadProgress(),
	zValidator("form", uploadSchema as any),
	requireAuth(),
	async (c) => {
		try {
			const { file, drawingId } = c.req.valid("form");
			const user = c.get("user");
			const _uploadProgress = c.get("uploadProgress");

			if (!user || !user.id) {
				return createErrorResponse(
					c,
					new Error("User not authenticated"),
					"Authentication required",
					401,
				);
			}

			// Validate file is not empty
			if (file.size === 0) {
				return createValidationErrorResponse(c, new Error("File is empty"));
			}

			// Validate file extension
			if (!isValidDrawingFileExtension(file.name)) {
				return createValidationErrorResponse(c, new Error("Invalid file type"), {
					allowed_extensions: [
						".png",
						".jpg",
						".jpeg",
						".gif",
						".webp",
						".svg",
						".json",
						".pdf",
						".doc",
						".docx",
						".txt",
					],
					provided_file: file.name,
				});
			}

			// Validate file size (max 10MB)
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				return createValidationErrorResponse(c, new Error("File too large"), {
					max_size_bytes: maxSize,
					provided_size_bytes: file.size,
				});
			}

			// Generate unique key
			const key = generateDrawingAssetKey(user.id, file.name);
			const contentType = file.type || getContentTypeFromFilename(file.name);

			// Try R2 upload first, fallback to base64 if not available
			let url: string;
			let storageType: string;
			let base64Data: string | null = null;

			try {
				const r2 = createDrawingAssetsR2(c);
				const uploadResult = await r2.uploadFileBuffer(key, await file.arrayBuffer(), {
					contentType,
					contentLength: file.size,
					customMetadata: {
						originalName: file.name,
						uploadedBy: user.id,
						uploadTime: new Date().toISOString(),
						drawingId: drawingId || "",
					},
				});
				url = uploadResult.key;
				storageType = "r2";
			} catch (r2Error) {
				console.warn("R2 upload failed, falling back to base64:", r2Error);

				// Fallback to base64 storage
				const base64Content = await file.arrayBuffer();
				const decoder = new TextDecoder();
				base64Data = btoa(decoder.decode(base64Content));
				url = `base64:${Date.now()}-${file.name}`;
				storageType = "base64";
			}

			// Store asset metadata in database
			const drawingService = new DrawingService(c.env.DB);
			const assetData = {
				id: crypto.randomUUID(),
				drawingId: drawingId || null,
				userId: user.id,
				fileName: file.name,
				fileType: contentType,
				fileSize: file.size,
				url,
				storageType,
				base64Data,
			};

			const assetId = await drawingService.createDrawingAsset(assetData);

			return c.json({
				success: true,
				data: {
					id: assetId,
					key: url,
					etag: storageType === "r2" ? key : "base64-fallback",
					url: `/api/v1/assets/${assetId}`,
					size: file.size,
					contentType,
					storageType,
					uploadedAt: new Date().toISOString(),
					drawingId,
				},
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes("R2 bucket not configured")) {
				return createErrorResponse(c, error, "Storage not available", 503);
			}
			return createErrorResponse(c, error, "Failed to upload file");
		}
	},
);

// Get asset metadata or download file
assetsRoutes.get("/:id", zValidator("param", getAssetSchema as any), requireAuth(), async (c) => {
	try {
		const { id } = c.req.valid("param");
		const user = c.get("user");

		if (!user || !user.id) {
			return createErrorResponse(
				c,
				new Error("User not authenticated"),
				"Authentication required",
				401,
			);
		}

		const drawingService = new DrawingService(c.env.DB);
		const asset = await drawingService.getDrawingAsset(id, user.id);

		if (!asset) {
			return createNotFoundErrorResponse(c, "Drawing asset", id);
		}

		// If requested, redirect to file download
		if (c.req.query("download") === "true") {
			if (asset.storageType === "r2") {
				try {
					const r2 = createDrawingAssetsR2(c);
					const result = await r2.downloadFile(asset.url);

					return new Response(result.body, {
						headers: {
							"Content-Type": asset.fileType,
							"Content-Length": asset.fileSize.toString(),
							"Content-Disposition": `attachment; filename="${asset.fileName}"`,
							"Cache-Control": "public, max-age=31536000",
						},
					});
				} catch (r2Error) {
					console.error("R2 download failed:", r2Error);
					return createErrorResponse(c, r2Error, "Failed to download from R2", 503);
				}
			} else if (asset.storageType === "base64") {
				// Return base64 file
				const base64Content = asset.base64Data;
				if (!base64Content) {
					return createErrorResponse(c, new Error("Base64 data not found"), "File not found", 404);
				}
				const binaryContent = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));

				return new Response(binaryContent, {
					headers: {
						"Content-Type": asset.fileType,
						"Content-Length": asset.fileSize.toString(),
						"Content-Disposition": `attachment; filename="${asset.fileName}"`,
						"Cache-Control": "public, max-age=31536000",
					},
				});
			}
		}

		// Return metadata by default
		return c.json({
			success: true,
			data: {
				id: asset.id,
				fileName: asset.fileName,
				fileType: asset.fileType,
				fileSize: asset.fileSize,
				url: `/api/v1/assets/${asset.id}`,
				downloadUrl: `/api/v1/assets/${asset.id}?download=true`,
				storageType: asset.storageType,
				createdAt: asset.createdAt,
				updatedAt: asset.updatedAt,
				drawingId: asset.drawingId,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("not found")) {
			return createNotFoundErrorResponse(c, "Drawing asset", c.req.param("id"));
		}
		return createErrorResponse(c, error, "Failed to get asset");
	}
});

// Delete asset
assetsRoutes.delete(
	"/:id",
	zValidator("param", deleteAssetSchema as any),
	requireAuth(),
	async (c) => {
		try {
			const { id } = c.req.valid("param");
			const user = c.get("user");

			if (!user || !user.id) {
				return createErrorResponse(
					c,
					new Error("User not authenticated"),
					"Authentication required",
					401,
				);
			}

			const drawingService = new DrawingService(c.env.DB);
			const asset = await drawingService.getDrawingAsset(id, user.id);

			if (!asset) {
				return createNotFoundErrorResponse(c, "Drawing asset", id);
			}

			// Delete from R2 if it's R2 storage
			if (asset.storageType === "r2") {
				try {
					const r2 = createDrawingAssetsR2(c);
					await r2.deleteFile(asset.url);
				} catch (r2Error) {
					console.error("Failed to delete from R2:", r2Error);
					// Continue even if R2 deletion fails
				}
			}

			// Delete from database
			await drawingService.deleteDrawingAsset(id, user.id);

			return c.json({
				success: true,
				data: {
					message: "Asset deleted successfully",
					id,
				},
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes("not found")) {
				return createNotFoundErrorResponse(c, "Drawing asset", c.req.param("id"));
			}
			return createErrorResponse(c, error, "Failed to delete asset");
		}
	},
);

// List all assets for a drawing
assetsRoutes.get(
	"/drawing/:drawingId",
	zValidator("param", listAssetsSchema as any),
	requireAuth(),
	async (c) => {
		try {
			const { drawingId } = c.req.valid("param");
			const user = c.get("user");

			if (!user || !user.id) {
				return createErrorResponse(
					c,
					new Error("User not authenticated"),
					"Authentication required",
					401,
				);
			}

			const drawingService = new DrawingService(c.env.DB);
			const assets = await drawingService.getDrawingAssetsByDrawingId(drawingId, user.id);

			return c.json({
				success: true,
				data: {
					drawingId,
					assets: assets.map((asset) => ({
						id: asset.id,
						fileName: asset.fileName,
						fileType: asset.fileType,
						fileSize: asset.fileSize,
						url: `/api/v1/assets/${asset.id}`,
						downloadUrl: `/api/v1/assets/${asset.id}?download=true`,
						storageType: asset.storageType,
						createdAt: asset.createdAt,
						updatedAt: asset.updatedAt,
					})),
					total: assets.length,
				},
			});
		} catch (error) {
			return createErrorResponse(c, error, "Failed to list assets");
		}
	},
);

export default assetsRoutes;
