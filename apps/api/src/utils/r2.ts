// Utility functions for R2 operations for drawing assets storage

import type { R2Bucket, R2ListOptions } from "@cloudflare/workers-types";
import type { Context } from "hono";

export interface R2UploadOptions {
	contentType: string;
	contentLength: number;
	customMetadata?: Record<string, string>;
}

export interface R2FileMetadata {
	key: string;
	size: number;
	contentLength: number;
	lastModified: Date;
	contentType: string;
	customMetadata?: Record<string, string>;
}

export class DrawingAssetsR2 {
	constructor(private bucket: R2Bucket) {}

	/**
	 * Upload a file to R2 bucket
	 */
	async uploadFile(
		key: string,
		body: ReadableStream,
		options: R2UploadOptions,
	): Promise<{ key: string; etag: string }> {
		try {
			const uploadResponse = await this.bucket.put(key, body, {
				httpMetadata: {
					contentType: options.contentType,
				},
				customMetadata: {
					...options.customMetadata,
					contentLength: options.contentLength.toString(),
				},
			});

			return {
				key,
				etag: uploadResponse.etag || "",
			};
		} catch (error) {
			throw new Error(
				`Failed to upload file to R2: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Upload a file with buffer input
	 */
	async uploadFileBuffer(
		key: string,
		buffer: ArrayBuffer,
		options: R2UploadOptions,
	): Promise<{ key: string; etag: string }> {
		const body = new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(buffer));
				controller.close();
			},
		});

		return this.uploadFile(key, body, {
			...options,
			contentLength: buffer.byteLength,
		});
	}

	/**
	 * Download a file from R2 bucket
	 */
	async downloadFile(key: string): Promise<{ body: ReadableStream; metadata: R2FileMetadata }> {
		try {
			const object = await this.bucket.get(key);

			if (!object) {
				throw new Error(`File not found: ${key}`);
			}

			const metadata = object.customMetadata || {};
			const contentLength = parseInt(metadata.contentLength || "0", 10);
			const fileMetadata: R2FileMetadata = {
				key,
				size: object.size || 0,
				contentLength,
				lastModified: object.uploaded ? new Date(object.uploaded) : new Date(),
				contentType: object.httpMetadata?.contentType || "application/octet-stream",
				customMetadata: metadata,
			};

			return {
				body: object.body,
				metadata: fileMetadata,
			};
		} catch (error) {
			throw new Error(
				`Failed to download file from R2: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Delete a file from R2 bucket
	 */
	async deleteFile(key: string): Promise<boolean> {
		try {
			await this.bucket.delete(key);
			return true;
		} catch (error) {
			throw new Error(
				`Failed to delete file from R2: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * List files in R2 bucket with pagination
	 */
	async listFiles(prefix?: string, limit: number = 1000): Promise<R2FileMetadata[]> {
		try {
			const listOptions: R2ListOptions = {
				limit,
				prefix,
			};

			const objects = await this.bucket.list(listOptions);
			const files: R2FileMetadata[] = [];

			for (const object of objects.objects) {
				const metadata = object.customMetadata || {};
				const contentLength = parseInt(metadata.contentLength || "0", 10);
				files.push({
					key: object.key,
					size: object.size || 0,
					contentLength,
					lastModified: object.uploaded ? new Date(object.uploaded) : new Date(),
					contentType: object.httpMetadata?.contentType || "application/octet-stream",
					customMetadata: metadata,
				});
			}

			return files;
		} catch (error) {
			throw new Error(
				`Failed to list files from R2: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Generate a signed URL for temporary access to a file
	 * Note: This feature requires R2 pre-signed URLs which may need additional configuration
	 */
	async generateSignedUrl(key: string, _expiresInSeconds: number = 3600): Promise<string> {
		try {
			// For now, return the direct URL without signing
			// In production, you'll need to configure R2 pre-signed URLs or use Cloudflare Workers signed uploads
			return `https://<your-r2-domain>.r2.cloudflarestorage.com/${key}`;
		} catch (error) {
			throw new Error(
				`Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Generate a signed URL for uploading a file
	 * Note: This feature requires R2 pre-signed URLs which may need additional configuration
	 */
	async generateUploadUrl(key: string, _expiresInSeconds: number = 3600): Promise<string> {
		try {
			// For now, return the direct URL without signing
			// In production, you'll need to configure R2 pre-signed URLs or use Cloudflare Workers signed uploads
			return `https://<your-r2-domain>.r2.cloudflarestorage.com/${key}`;
		} catch (error) {
			throw new Error(
				`Failed to generate upload URL: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

/**
 * Create DrawingAssetsR2 instance from environment context
 */
export function createDrawingAssetsR2(c: Context): DrawingAssetsR2 {
	const bucket = c.env.DRAWING_ASSETS;
	if (!bucket) {
		throw new Error("R2 bucket not configured in environment");
	}
	return new DrawingAssetsR2(bucket);
}

/**
 * Generate unique file key for user's drawing asset
 */
export function generateDrawingAssetKey(userId: string, filename: string): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
	return `users/${userId}/drawings/${timestamp}-${sanitizedFilename}`;
}

/**
 * Validate file extension for drawing assets
 */
export function isValidDrawingFileExtension(filename: string): boolean {
	const allowedExtensions = [
		".png",
		".jpg",
		".jpeg",
		".gif",
		".webp",
		".svg", // Images
		".json", // TLDraw JSON files
		".pdf", // PDF files
		".doc",
		".docx", // Word documents
		".txt", // Text files
	];

	const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));
	return allowedExtensions.includes(extension);
}

/**
 * Get content type from filename
 */
export function getContentTypeFromFilename(filename: string): string {
	const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));

	const mimeTypes: Record<string, string> = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".webp": "image/webp",
		".svg": "image/svg+xml",
		".json": "application/json",
		".pdf": "application/pdf",
		".doc": "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".txt": "text/plain",
	};

	return mimeTypes[extension] || "application/octet-stream";
}

/**
 * R2 Manager for Trip Planner Images
 */
export class TripImagesR2 extends DrawingAssetsR2 {
	// Reusing the base class methods but with specific Trip Planner context if needed
	// For now, the base methods are sufficient, but we create a separate class for semantic clarity
	// and future extensibility (e.g., different path structures or metadata)
}

/**
 * Create TripImagesR2 instance from environment context
 */
export function createTripImagesR2(c: Context): TripImagesR2 {
	const bucket = c.env.TRIP_IMAGES;
	// Fallback to DRAWING_ASSETS if TRIP_IMAGES is not set (for development/testing flexibility)
	// But in production, it should be set
	const targetBucket = bucket || c.env.DRAWING_ASSETS;

	if (!targetBucket) {
		throw new Error("R2 bucket for trip images not configured in environment");
	}
	return new TripImagesR2(targetBucket);
}

/**
 * Generate unique file key for trip planner image
 */
export function generateTripImageKey(tripId: string, itemId: string, filename: string): string {
    const timestamp = Date.now();
    // Sanitize filename to remove special characters
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
	// Structure: trips/<tripId>/items/<itemId>/<timestamp>-<filename>
	return `trips/${tripId}/items/${itemId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Validate file extension for trip images
 */
export function isValidTripImageExtension(filename: string): boolean {
	const allowedExtensions = [
		".png",
		".jpg",
		".jpeg",
		".webp",
        ".heic", // Common on mobile
        ".heif"
	];

	const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));
	return allowedExtensions.includes(extension);
}

