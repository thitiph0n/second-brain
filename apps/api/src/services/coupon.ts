import type { Coupon, CreateCouponRequest, UpdateCouponRequest } from "@second-brain/types/coupon";

export class CouponService {
	constructor(private db: D1Database) {}

	private transformCouponFromDb(rawCoupon: any): Coupon {
		return {
			id: rawCoupon.id,
			userId: rawCoupon.user_id,
			code: rawCoupon.code,
			type: rawCoupon.type,
			expiresAt: rawCoupon.expires_at,
			isUsed: Boolean(rawCoupon.is_used), // Convert SQLite integer to boolean
			usedAt: rawCoupon.used_at,
			createdAt: rawCoupon.created_at,
			updatedAt: rawCoupon.updated_at,
		};
	}

	private async ensureDatabaseInitialized(): Promise<void> {
		try {
			// Check if coupons table exists by attempting a simple query
			await this.db.prepare("SELECT COUNT(*) FROM coupons LIMIT 1").first();
		} catch (error) {
			console.error("Database error - coupons table may not exist:", error);
			throw new Error(
				`Database initialization error: ${error instanceof Error ? error.message : "Unknown database error"}`,
			);
		}
	}

	async createCoupon(userId: string, data: CreateCouponRequest): Promise<Coupon> {
		try {
			await this.ensureDatabaseInitialized();

			const id = crypto.randomUUID();
			const now = new Date().toISOString();

			const result = await this.db
				.prepare(
					`INSERT INTO coupons (id, user_id, code, type, expires_at, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           RETURNING *`,
				)
				.bind(id, userId, data.code, data.type, data.expiresAt || null, now, now)
				.first<Coupon>();

			if (!result) {
				throw new Error("Database returned empty result when creating coupon");
			}

			return this.transformCouponFromDb(result);
		} catch (error) {
			console.error("Error in createCoupon:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to create coupon: ${error.message}`);
			}
			throw new Error("Failed to create coupon: Unknown error occurred");
		}
	}

	async getCouponsByUser(userId: string): Promise<Coupon[]> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare(`
					SELECT * FROM coupons
					WHERE user_id = ?1
					ORDER BY
						-- Priority 1: Coupons expiring within 7 days (near expired)
						CASE
							WHEN expires_at IS NOT NULL
							AND datetime(expires_at) >= datetime('now')
							AND (julianday(expires_at) - julianday('now')) <= 7
							THEN 0
							ELSE 1
						END,
						-- Priority 2: Expiration date (soonest first)
						CASE
							WHEN expires_at IS NULL THEN 999999999
							ELSE julianday(expires_at)
						END,
						-- Priority 3: Creation date (newest first)
						datetime(created_at) DESC
				`)
				.bind(userId)
				.all<Coupon>();

			if (!result.success) {
				throw new Error(`Database query failed: ${result.error || "Unknown database error"}`);
			}

			return (result.results || []).map((coupon) => this.transformCouponFromDb(coupon));
		} catch (error) {
			console.error("Error in getCouponsByUser:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch coupons: ${error.message}`);
			}
			throw new Error("Failed to fetch coupons: Unknown error occurred");
		}
	}

	async getCouponById(id: string, userId: string): Promise<Coupon | null> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare("SELECT * FROM coupons WHERE id = ?1 AND user_id = ?2")
				.bind(id, userId)
				.first<Coupon>();

			return result ? this.transformCouponFromDb(result) : null;
		} catch (error) {
			console.error("Error in getCouponById:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch coupon: ${error.message}`);
			}
			throw new Error("Failed to fetch coupon: Unknown error occurred");
		}
	}

	async updateCoupon(id: string, userId: string, data: UpdateCouponRequest): Promise<Coupon | null> {
		try {
			await this.ensureDatabaseInitialized();

			const existingCoupon = await this.getCouponById(id, userId);
			if (!existingCoupon) {
				return null;
			}

			const now = new Date().toISOString();
			const usedAt =
				data.isUsed === true ? now : data.isUsed === false ? null : existingCoupon.usedAt;

			const result = await this.db
				.prepare(
					`UPDATE coupons 
           SET code = COALESCE(?3, code), 
               type = COALESCE(?4, type),
               expires_at = COALESCE(?5, expires_at),
               is_used = COALESCE(?6, is_used),
               used_at = ?7,
               updated_at = ?8
           WHERE id = ?1 AND user_id = ?2
           RETURNING *`,
				)
				.bind(
					id,
					userId,
					data.code || null,
					data.type || null,
					data.expiresAt !== undefined ? data.expiresAt : null,
					data.isUsed !== undefined ? data.isUsed : null,
					usedAt,
					now,
				)
				.first<Coupon>();

			return result ? this.transformCouponFromDb(result) : null;
		} catch (error) {
			console.error("Error in updateCoupon:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to update coupon: ${error.message}`);
			}
			throw new Error("Failed to update coupon: Unknown error occurred");
		}
	}

	async deleteCoupon(id: string, userId: string): Promise<boolean> {
		try {
			await this.ensureDatabaseInitialized();

			const result = await this.db
				.prepare("DELETE FROM coupons WHERE id = ?1 AND user_id = ?2")
				.bind(id, userId)
				.run();

			if (!result.success) {
				throw new Error(`Database delete failed: ${result.error || "Unknown database error"}`);
			}

			return result.meta.changes > 0;
		} catch (error) {
			console.error("Error in deleteCoupon:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to delete coupon: ${error.message}`);
			}
			throw new Error("Failed to delete coupon: Unknown error occurred");
		}
	}

	async bulkDeleteCoupons(ids: string[], userId: string): Promise<number> {
		try {
			await this.ensureDatabaseInitialized();

			if (ids.length === 0) {
				return 0;
			}

			// Create placeholders for the IN clause
			const placeholders = ids.map((_, index) => `?${index + 2}`).join(", ");

			const result = await this.db
				.prepare(`DELETE FROM coupons WHERE user_id = ?1 AND id IN (${placeholders})`)
				.bind(userId, ...ids)
				.run();

			if (!result.success) {
				throw new Error(`Database bulk delete failed: ${result.error || "Unknown database error"}`);
			}

			return result.meta.changes;
		} catch (error) {
			console.error("Error in bulkDeleteCoupons:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to bulk delete coupons: ${error.message}`);
			}
			throw new Error("Failed to bulk delete coupons: Unknown error occurred");
		}
	}
}
