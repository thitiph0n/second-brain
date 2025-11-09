import type {
	CreateDrawingRequest,
	Drawing,
	DrawingAsset,
	UpdateDrawingRequest,
} from "@second-brain/types/drawing";

export class DrawingService {
	constructor(private db: D1Database) {}

	private transformDrawingAssetFromDb(rawAsset: any): DrawingAsset {
		return {
			id: rawAsset.id,
			drawingId: rawAsset.drawing_id,
			userId: rawAsset.user_id,
			fileName: rawAsset.file_name,
			fileType: rawAsset.file_type,
			fileSize: rawAsset.file_size,
			url: rawAsset.url,
			storageType: rawAsset.storage_type,
			base64Data: rawAsset.base64_data,
			createdAt: rawAsset.created_at,
			updatedAt: rawAsset.updated_at,
		};
	}

	private transformDrawingFromDb(rawDrawing: any): Drawing {
		return {
			id: rawDrawing.id,
			title: rawDrawing.name,
			description: rawDrawing.description,
			userId: rawDrawing.user_id,
			parentId: rawDrawing.parent_id,
			type: rawDrawing.type,
			data: rawDrawing.data,
			createdAt: rawDrawing.created_at,
			updatedAt: rawDrawing.updated_at,
		};
	}

	private async ensureDatabaseInitialized(): Promise<void> {
		try {
			// Check if drawings table exists by attempting a simple query
			await this.db.prepare("SELECT COUNT(*) FROM drawings LIMIT 1").first();
		} catch (error) {
			console.error("Database error - drawings table may not exist:", error);
			throw new Error(
				`Database initialization error: ${error instanceof Error ? error.message : "Unknown database error"}`,
			);
		}
	}

	async createDrawing(userId: string, data: CreateDrawingRequest): Promise<Drawing> {
		try {
			await this.ensureDatabaseInitialized();

			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			const type = data.type || "drawing";

			const result = await this.db
				.prepare(
					`INSERT INTO drawings (id, user_id, name, description, parent_id, type, data, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
           RETURNING *`,
				)
				.bind(
					id,
					userId,
					data.title,
					data.description || null,
					data.parentId || null,
					type,
					data.data || null,
					now,
					now,
				)
				.first<Drawing>();

			if (!result) {
				throw new Error("Database returned empty result when creating drawing");
			}

			return this.transformDrawingFromDb(result);
		} catch (error) {
			console.error("Error in createDrawing:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to create drawing: ${error.message}`);
			}
			throw new Error("Failed to create drawing: Unknown error occurred");
		}
	}

	async getDrawingsByUser(userId: string): Promise<Drawing[]> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare(`
					SELECT * FROM drawings
					WHERE user_id = ?1
					ORDER BY
						-- Priority 1: Folders first (type = 'folder')
						CASE type WHEN 'folder' THEN 0 ELSE 1 END,
						-- Priority 2: Creation date (newest first)
						datetime(created_at) DESC
				`)
				.bind(userId)
				.all<Drawing>();

			if (!result.success) {
				throw new Error(`Database query failed: ${result.error || "Unknown database error"}`);
			}

			return (result.results || []).map((drawing) => this.transformDrawingFromDb(drawing));
		} catch (error) {
			console.error("Error in getDrawingsByUser:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawings: ${error.message}`);
			}
			throw new Error("Failed to fetch drawings: Unknown error occurred");
		}
	}

	async getDrawingsByFolder(userId: string, parentId: string): Promise<Drawing[]> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare(`
					SELECT * FROM drawings
					WHERE user_id = ?1 AND parent_id = ?2
					ORDER BY
						-- Priority 1: Folders first (type = 'folder')
						CASE type WHEN 'folder' THEN 0 ELSE 1 END,
						-- Priority 2: Creation date (newest first)
						datetime(created_at) DESC
				`)
				.bind(userId, parentId)
				.all<Drawing>();

			if (!result.success) {
				throw new Error(`Database query failed: ${result.error || "Unknown database error"}`);
			}

			return (result.results || []).map((drawing) => this.transformDrawingFromDb(drawing));
		} catch (error) {
			console.error("Error in getDrawingsByFolder:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawings: ${error.message}`);
			}
			throw new Error("Failed to fetch drawings: Unknown error occurred");
		}
	}

	async getDrawingById(id: string, userId: string): Promise<Drawing | null> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare("SELECT * FROM drawings WHERE id = ?1 AND user_id = ?2")
				.bind(id, userId)
				.first<Drawing>();

			return result ? this.transformDrawingFromDb(result) : null;
		} catch (error) {
			console.error("Error in getDrawingById:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing: ${error.message}`);
			}
			throw new Error("Failed to fetch drawing: Unknown error occurred");
		}
	}

	async updateDrawing(
		id: string,
		userId: string,
		data: UpdateDrawingRequest,
	): Promise<Drawing | null> {
		try {
			await this.ensureDatabaseInitialized();

			const existingDrawing = await this.getDrawingById(id, userId);
			if (!existingDrawing) {
				return null;
			}

			const now = new Date().toISOString();

			const result = await this.db
				.prepare(
					`UPDATE drawings
           SET name = COALESCE(?3, name),
               description = COALESCE(?4, description),
               parent_id = COALESCE(?5, parent_id),
               data = COALESCE(?6, data),
               updated_at = ?7
           WHERE id = ?1 AND user_id = ?2
           RETURNING *`,
				)
				.bind(
					id,
					userId,
					data.title || null,
					data.description || null,
					data.parentId || null,
					data.data || null,
					now,
				)
				.first<Drawing>();

			return result ? this.transformDrawingFromDb(result) : null;
		} catch (error) {
			console.error("Error in updateDrawing:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to update drawing: ${error.message}`);
			}
			throw new Error("Failed to update drawing: Unknown error occurred");
		}
	}

	async deleteDrawing(id: string, userId: string): Promise<boolean> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare("DELETE FROM drawings WHERE id = ?1 AND user_id = ?2")
				.bind(id, userId)
				.run();

			if (!result.success) {
				throw new Error(`Database delete failed: ${result.error || "Unknown database error"}`);
			}

			return result.meta.changes > 0;
		} catch (error) {
			console.error("Error in deleteDrawing:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to delete drawing: ${error.message}`);
			}
			throw new Error("Failed to delete drawing: Unknown error occurred");
		}
	}

	async bulkDeleteDrawings(ids: string[], userId: string): Promise<number> {
		try {
			await this.ensureDatabaseInitialized();

			if (ids.length === 0) {
				return 0;
			}

			// Create placeholders for the IN clause
			const placeholders = ids.map((_, index) => `?${index + 2}`).join(", ");

			const result = await this.db
				.prepare(`DELETE FROM drawings WHERE user_id = ?1 AND id IN (${placeholders})`)
				.bind(userId, ...ids)
				.run();

			if (!result.success) {
				throw new Error(`Database bulk delete failed: ${result.error || "Unknown database error"}`);
			}

			return result.meta.changes;
		} catch (error) {
			console.error("Error in bulkDeleteDrawings:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to bulk delete drawings: ${error.message}`);
			}
			throw new Error("Failed to bulk delete drawings: Unknown error occurred");
		}
	}

	async createDrawingAsset(assetData: {
		id: string;
		drawingId: string | null;
		userId: string;
		fileName: string;
		fileType: string;
		fileSize: number;
		url: string;
		storageType: string;
		base64Data: string | null;
	}): Promise<string> {
		try {
			await this.ensureDatabaseInitialized();

			const now = new Date().toISOString();

			const result = await this.db
				.prepare(
					`INSERT INTO drawing_assets (id, drawing_id, user_id, file_name, file_type, file_size, url, storage_type, base64_data, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
           RETURNING id`,
				)
				.bind(
					assetData.id,
					assetData.drawingId,
					assetData.userId,
					assetData.fileName,
					assetData.fileType,
					assetData.fileSize,
					assetData.url,
					assetData.storageType,
					assetData.base64Data,
					now,
					now,
				)
				.first<{ id: string }>();

			if (!result) {
				throw new Error("Database returned empty result when creating drawing asset");
			}

			return result.id;
		} catch (error) {
			console.error("Error in createDrawingAsset:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to create drawing asset: ${error.message}`);
			}
			throw new Error("Failed to create drawing asset: Unknown error occurred");
		}
	}

	async getDrawingAsset(id: string, userId: string): Promise<DrawingAsset | null> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare("SELECT * FROM drawing_assets WHERE id = ?1 AND user_id = ?2")
				.bind(id, userId)
				.first<DrawingAsset>();

			return result ? this.transformDrawingAssetFromDb(result) : null;
		} catch (error) {
			console.error("Error in getDrawingAsset:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing asset: ${error.message}`);
			}
			throw new Error("Failed to fetch drawing asset: Unknown error occurred");
		}
	}

	async getDrawingAssetsByDrawingId(drawingId: string, userId: string): Promise<DrawingAsset[]> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare(`
					SELECT * FROM drawing_assets
					WHERE user_id = ?1 AND drawing_id = ?2
					ORDER BY created_at DESC
				`)
				.bind(userId, drawingId)
				.all<DrawingAsset>();

			if (!result.success) {
				throw new Error(`Database query failed: ${result.error || "Unknown database error"}`);
			}

			return (result.results || []).map((asset) => this.transformDrawingAssetFromDb(asset));
		} catch (error) {
			console.error("Error in getDrawingAssetsByDrawingId:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing assets: ${error.message}`);
			}
			throw new Error("Failed to fetch drawing assets: Unknown error occurred");
		}
	}

	async deleteDrawingAsset(id: string, userId: string): Promise<boolean> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare("DELETE FROM drawing_assets WHERE id = ?1 AND user_id = ?2")
				.bind(id, userId)
				.run();

			if (!result.success) {
				throw new Error(`Database delete failed: ${result.error || "Unknown database error"}`);
			}

			return result.meta.changes > 0;
		} catch (error) {
			console.error("Error in deleteDrawingAsset:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to delete drawing asset: ${error.message}`);
			}
			throw new Error("Failed to delete drawing asset: Unknown error occurred");
		}
	}

}
