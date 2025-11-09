import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Coupon, CreateCouponRequest, UpdateCouponRequest, CouponType } from '@second-brain/types/coupon';
import { coupons } from '@second-brain/database/schema';

export class CouponService {
	private db: ReturnType<typeof drizzle>;

	constructor(d1Database: D1Database) {
		this.db = drizzle(d1Database);
	}

	private transformCouponFromDb(rawCoupon: any): Coupon {
		return {
			id: rawCoupon.id,
			userId: rawCoupon.userId,
			code: rawCoupon.code,
			type: rawCoupon.type as CouponType, // Type assertion for CouponType
			expiresAt: rawCoupon.expiresAt || undefined,
			isUsed: Boolean(rawCoupon.isUsed), // Convert SQLite integer to boolean
			usedAt: rawCoupon.usedAt || undefined,
			createdAt: rawCoupon.createdAt || '',
			updatedAt: rawCoupon.updatedAt || '',
		};
	}

	async createCoupon(userId: string, data: CreateCouponRequest): Promise<Coupon> {
		try {
			const id = crypto.randomUUID();
			const now = new Date().toISOString();

			const result = await this.db
				.insert(coupons)
				.values({
					id,
					userId,
					code: data.code,
					type: data.type,
					expiresAt: data.expiresAt || null,
					createdAt: now,
					updatedAt: now,
				})
				.returning()
				.get();

			if (!result) {
				throw new Error('Database returned empty result when creating coupon');
			}

			return this.transformCouponFromDb(result);
		} catch (error) {
			console.error('Error in createCoupon:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to create coupon: ${error.message}`);
			}
			throw new Error('Failed to create coupon: Unknown error occurred');
		}
	}

	async getCouponsByUser(userId: string): Promise<Coupon[]> {
		try {
			const result = await this.db
				.select()
				.from(coupons)
				.where(eq(coupons.userId, userId))
				.orderBy(
					sql`
						-- Priority 1: Coupons expiring within 7 days (near expired)
						CASE
							WHEN ${coupons.expiresAt} IS NOT NULL
							AND ${coupons.expiresAt} >= ${new Date().toISOString()}
							AND (julianday(${coupons.expiresAt}) - julianday('now')) <= 7
							THEN 0
							ELSE 1
						END,
						-- Priority 2: Expiration date (soonest first)
						CASE
							WHEN ${coupons.expiresAt} IS NULL THEN 999999999
							ELSE julianday(${coupons.expiresAt})
						END,
						-- Priority 3: Creation date (newest first)
						${coupons.createdAt} DESC
					`,
				)
				.all();

			return result.map((coupon) => this.transformCouponFromDb(coupon));
		} catch (error) {
			console.error('Error in getCouponsByUser:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch coupons: ${error.message}`);
			}
			throw new Error('Failed to fetch coupons: Unknown error occurred');
		}
	}

	async getCouponById(id: string, userId: string): Promise<Coupon | null> {
		try {
			const result = await this.db
				.select()
				.from(coupons)
				.where(and(eq(coupons.id, id), eq(coupons.userId, userId)))
				.get();

			return result ? this.transformCouponFromDb(result) : null;
		} catch (error) {
			console.error('Error in getCouponById:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch coupon: ${error.message}`);
			}
			throw new Error('Failed to fetch coupon: Unknown error occurred');
		}
	}

	async updateCoupon(
		id: string,
		userId: string,
		data: UpdateCouponRequest,
	): Promise<Coupon | null> {
		try {
			const existingCoupon = await this.getCouponById(id, userId);
			if (!existingCoupon) {
				return null;
			}

			const now = new Date().toISOString();
			const usedAt =
				data.isUsed === true ? now : data.isUsed === false ? null : existingCoupon.usedAt;

			const updateData: Partial<typeof coupons.$inferInsert> = {
				updatedAt: now,
			};

			if (data.code !== undefined) updateData.code = data.code;
			if (data.type !== undefined) updateData.type = data.type;
			if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
			if (data.isUsed !== undefined) updateData.isUsed = data.isUsed;
			if (usedAt !== undefined) updateData.usedAt = usedAt;

			const result = await this.db
				.update(coupons)
				.set(updateData)
				.where(and(eq(coupons.id, id), eq(coupons.userId, userId)))
				.returning()
				.get();

			return result ? this.transformCouponFromDb(result) : null;
		} catch (error) {
			console.error('Error in updateCoupon:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to update coupon: ${error.message}`);
			}
			throw new Error('Failed to update coupon: Unknown error occurred');
		}
	}

	async deleteCoupon(id: string, userId: string): Promise<boolean> {
		try {
			const result = await this.db
				.delete(coupons)
				.where(and(eq(coupons.id, id), eq(coupons.userId, userId)))
				.run();

			return result.meta.changes > 0;
		} catch (error) {
			console.error('Error in deleteCoupon:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to delete coupon: ${error.message}`);
			}
			throw new Error('Failed to delete coupon: Unknown error occurred');
		}
	}

	async bulkDeleteCoupons(ids: string[], userId: string): Promise<number> {
		try {
			if (ids.length === 0) {
				return 0;
			}

			// For Drizzle with SQLite/D1, we need to use IN clause with dynamic IDs
			// This is a limitation we need to work around
			let totalChanges = 0;

			for (const id of ids) {
				const result = await this.db
					.delete(coupons)
					.where(and(eq(coupons.id, id), eq(coupons.userId, userId)))
					.run();

				totalChanges += result.meta.changes;
			}

			return totalChanges;
		} catch (error) {
			console.error('Error in bulkDeleteCoupons:', error);
			if (error instanceof Error) {
				throw new Error(`Failed to bulk delete coupons: ${error.message}`);
			}
			throw new Error('Failed to bulk delete coupons: Unknown error occurred');
		}
	}
}