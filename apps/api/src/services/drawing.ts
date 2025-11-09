import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, sql, like } from 'drizzle-orm';
import type {
	CreateDrawingRequest,
	Drawing,
	DrawingAsset,
	UpdateDrawingRequest,
	DrawingType,
} from '@second-brain/types/drawing';
import type { Drawing as DrizzleDrawing, DrawingAsset as DrizzleDrawingAsset } from '@second-brain/database';
import { drawings, drawingAssets } from '@second-brain/database/schema';

export class DrawingService {
	private db: ReturnType<typeof drizzle>;

	constructor(d1Database: D1Database) {
		this.db = drizzle(d1Database);
	}

	private transformDrawingAssetFromDb(rawAsset: DrizzleDrawingAsset): DrawingAsset {
		return {
			id: rawAsset.id,
			drawingId: rawAsset.drawingId,
			userId: rawAsset.userId,
			fileName: rawAsset.fileName,
			fileType: rawAsset.fileType,
			fileSize: parseInt(rawAsset.fileSize, 10),
			url: rawAsset.url,
			storageType: 'r2', // Default to R2 storage
			base64Data: undefined, // Not stored in database
			createdAt: rawAsset.createdAt || '',
			updatedAt: rawAsset.createdAt || '', // Use created_at as updated_at
		};
	}

	private transformDrawingFromDb(rawDrawing: DrizzleDrawing): Drawing {
		return {
			id: rawDrawing.id,
			title: rawDrawing.title,
			description: rawDrawing.description || undefined,
			userId: rawDrawing.userId,
			parentId: rawDrawing.parentId || undefined,
			type: rawDrawing.type as DrawingType, // Proper type assertion
			data: rawDrawing.data || undefined,
			createdAt: rawDrawing.createdAt || '',
			updatedAt: rawDrawing.updatedAt || '',
		};
	}

	async createDrawing(userId: string, data: CreateDrawingRequest): Promise<Drawing> {
		try {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();
			const type = data.type || 'drawing';

			const result = await this.db
				.insert(drawings)
				.values({
					id,
					userId,
					title: data.title,
					description: data.description || null,
					parentId: data.parentId || null,
					type,
					data: data.data || null,
					createdAt: now,
					updatedAt: now,
				})
				.returning()
				.get();

			if (!result) {
				throw new Error('Database returned empty result when creating drawing');
			}

			return this.transformDrawingFromDb(result);
		} catch (error) {
			console.error('Error in createDrawing:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to create drawing: ${error.message}`);
			}
			throw new Error('Failed to create drawing: Unknown error occurred');
		}
	}

	async getDrawingsByUser(userId: string): Promise<Drawing[]> {
		try {
			const result = await this.db
				.select()
				.from(drawings)
				.where(
					and(
						eq(drawings.userId, userId),
						sql`${drawings.parentId} IS NULL`
					)
				)
				.orderBy(
					sql`
						-- Priority 1: Folders first (type = 'folder')
						CASE ${drawings.type} WHEN 'folder' THEN 0 ELSE 1 END,
						-- Priority 2: Creation date (newest first)
						${drawings.createdAt} DESC
					`,
				)
				.all();

			return result.map((drawing) => this.transformDrawingFromDb(drawing));
		} catch (error) {
			console.error('Error in getDrawingsByUser:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawings: ${error.message}`);
			}
			throw new Error('Failed to fetch drawings: Unknown error occurred');
		}
	}

	async getDrawingsByFolder(userId: string, parentId: string): Promise<Drawing[]> {
		try {
			const result = await this.db
				.select()
				.from(drawings)
				.where(and(eq(drawings.userId, userId), eq(drawings.parentId, parentId)))
				.orderBy(
					sql`
						-- Priority 1: Folders first (type = 'folder')
						CASE ${drawings.type} WHEN 'folder' THEN 0 ELSE 1 END,
						-- Priority 2: Creation date (newest first)
						${drawings.createdAt} DESC
					`,
				)
				.all();

			return result.map((drawing) => this.transformDrawingFromDb(drawing));
		} catch (error) {
			console.error('Error in getDrawingsByFolder:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawings: ${error.message}`);
			}
			throw new Error('Failed to fetch drawings: Unknown error occurred');
		}
	}

	async searchAllDrawings(userId: string, searchQuery: string): Promise<Drawing[]> {
		try {
			const result = await this.db
				.select()
				.from(drawings)
				.where(
					and(
						eq(drawings.userId, userId),
						like(drawings.title, `%${searchQuery}%`)
					)
				)
				.orderBy(
					sql`
						-- Priority 1: Folders first (type = 'folder')
						CASE ${drawings.type} WHEN 'folder' THEN 0 ELSE 1 END,
						-- Priority 2: Creation date (newest first)
						${drawings.createdAt} DESC
					`,
				)
				.all();

			return result.map((drawing) => this.transformDrawingFromDb(drawing));
		} catch (error) {
			console.error('Error in searchAllDrawings:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to search drawings: ${error.message}`);
			}
			throw new Error('Failed to search drawings: Unknown error occurred');
		}
	}

	async getDrawingById(id: string, userId: string): Promise<Drawing | null> {
		try {
			const result = await this.db
				.select()
				.from(drawings)
				.where(and(eq(drawings.id, id), eq(drawings.userId, userId)))
				.get();

			return result ? this.transformDrawingFromDb(result) : null;
		} catch (error) {
			console.error('Error in getDrawingById:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing: ${error.message}`);
			}
			throw new Error('Failed to fetch drawing: Unknown error occurred');
		}
	}

	async getDrawingPath(id: string, userId: string): Promise<Drawing[]> {
		try {
			const path: Drawing[] = [];
			let currentId: string | undefined = id;

			while (currentId) {
				const drawing = await this.getDrawingById(currentId, userId);
				if (!drawing) break;

				path.unshift(drawing);
				currentId = drawing.parentId;
			}

			return path;
		} catch (error) {
			console.error('Error in getDrawingPath:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing path: ${error.message}`);
			}
			throw new Error('Failed to fetch drawing path: Unknown error occurred');
		}
	}

	async updateDrawing(
		id: string,
		userId: string,
		data: UpdateDrawingRequest,
	): Promise<Drawing | null> {
		try {
			const existingDrawing = await this.getDrawingById(id, userId);
			if (!existingDrawing) {
				return null;
			}

			const now = new Date().toISOString();

			const updateData: Partial<typeof drawings.$inferInsert> = {
				updatedAt: now,
			};

			if (data.title !== undefined) updateData.title = data.title;
			if (data.description !== undefined) updateData.description = data.description;
			if (data.parentId !== undefined) updateData.parentId = data.parentId;
			if (data.data !== undefined) updateData.data = data.data;

			const result = await this.db
				.update(drawings)
				.set(updateData)
				.where(and(eq(drawings.id, id), eq(drawings.userId, userId)))
				.returning()
				.get();

			return result ? this.transformDrawingFromDb(result) : null;
		} catch (error) {
			console.error('Error in updateDrawing:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to update drawing: ${error.message}`);
			}
			throw new Error('Failed to update drawing: Unknown error occurred');
		}
	}

	async deleteDrawing(id: string, userId: string): Promise<boolean> {
		try {
			const result = await this.db
				.delete(drawings)
				.where(and(eq(drawings.id, id), eq(drawings.userId, userId)))
				.run();

			return result.meta.changes > 0;
		} catch (error) {
			console.error('Error in deleteDrawing:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to delete drawing: ${error.message}`);
			}
			throw new Error('Failed to delete drawing: Unknown error occurred');
		}
	}

	async bulkDeleteDrawings(ids: string[], userId: string): Promise<number> {
		try {
			if (ids.length === 0) {
				return 0;
			}

			// For Drizzle with SQLite/D1, we need to use individual deletes
			let totalChanges = 0;

			for (const id of ids) {
				const result = await this.db
					.delete(drawings)
					.where(and(eq(drawings.id, id), eq(drawings.userId, userId)))
					.run();

				totalChanges += result.meta.changes;
			}

			return totalChanges;
		} catch (error) {
			console.error('Error in bulkDeleteDrawings:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to bulk delete drawings: ${error.message}`);
			}
			throw new Error('Failed to bulk delete drawings: Unknown error occurred');
		}
	}

	async createDrawingAsset(assetData: {
		id: string;
		drawingId: string;
		userId: string;
		fileName: string;
		fileType: string;
		fileSize: number;
		url: string;
	}): Promise<string> {
		try {
			const now = new Date().toISOString();

			const result = await this.db
				.insert(drawingAssets)
				.values({
					id: assetData.id,
					drawingId: assetData.drawingId,
					userId: assetData.userId,
					fileName: assetData.fileName,
					fileType: assetData.fileType,
					fileSize: assetData.fileSize.toString(),
					url: assetData.url,
					createdAt: now,
				})
				.returning({ id: drawingAssets.id })
				.get();

			if (!result) {
				throw new Error('Database returned empty result when creating drawing asset');
			}

			return result.id;
		} catch (error) {
			console.error('Error in createDrawingAsset:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to create drawing asset: ${error.message}`);
			}
			throw new Error('Failed to create drawing asset: Unknown error occurred');
		}
	}

	async getDrawingAsset(id: string, userId: string): Promise<DrawingAsset | null> {
		try {
			const result = await this.db
				.select()
				.from(drawingAssets)
				.where(and(eq(drawingAssets.id, id), eq(drawingAssets.userId, userId)))
				.get();

			return result ? this.transformDrawingAssetFromDb(result) : null;
		} catch (error) {
			console.error('Error in getDrawingAsset:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing asset: ${error.message}`);
			}
			throw new Error('Failed to fetch drawing asset: Unknown error occurred');
		}
	}

	async getDrawingAssetsByDrawingId(drawingId: string, userId: string): Promise<DrawingAsset[]> {
		try {
			const result = await this.db
				.select()
				.from(drawingAssets)
				.where(and(eq(drawingAssets.userId, userId), eq(drawingAssets.drawingId, drawingId)))
				.orderBy(desc(drawingAssets.createdAt))
				.all();

			return result.map((asset) => this.transformDrawingAssetFromDb(asset));
		} catch (error) {
			console.error('Error in getDrawingAssetsByDrawingId:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing assets: ${error.message}`);
			}
			throw new Error('Failed to fetch drawing assets: Unknown error occurred');
		}
	}

	async deleteDrawingAsset(id: string, userId: string): Promise<boolean> {
		try {
			const result = await this.db
				.delete(drawingAssets)
				.where(and(eq(drawingAssets.id, id), eq(drawingAssets.userId, userId)))
				.run();

			return result.meta.changes > 0;
		} catch (error) {
			console.error('Error in deleteDrawingAsset:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to delete drawing asset: ${error.message}`);
			}
			throw new Error('Failed to delete drawing asset: Unknown error occurred');
		}
	}

	async getDrawingStats(userId: string): Promise<{
		totalDrawings: number;
		totalFolders: number;
		recentDrawings: Drawing[];
	}> {
		try {
			const [totalResult, recentResult] = await Promise.all([
				this.db
					.select({
						type: drawings.type,
						count: sql<number>`cast(count(*) as integer)`,
					})
					.from(drawings)
					.where(eq(drawings.userId, userId))
					.groupBy(drawings.type)
					.all(),
				this.db
					.select()
					.from(drawings)
					.where(
						and(
							eq(drawings.userId, userId),
							eq(drawings.type, 'drawing')
						)
					)
					.orderBy(desc(drawings.updatedAt))
					.limit(5)
					.all(),
			]);

			const totalDrawings = totalResult.find((r) => r.type === 'drawing')?.count || 0;
			const totalFolders = totalResult.find((r) => r.type === 'folder')?.count || 0;
			const recentDrawings = recentResult.map((drawing) => this.transformDrawingFromDb(drawing));

			return {
				totalDrawings,
				totalFolders,
				recentDrawings,
			};
		} catch (error) {
			console.error('Error in getDrawingStats:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch drawing stats: ${error.message}`);
			}
			throw new Error('Failed to fetch drawing stats: Unknown error occurred');
		}
	}
}
