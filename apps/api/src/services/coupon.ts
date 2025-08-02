import { Coupon, CouponCreateData, CouponUpdateData } from '../types/coupon';

export class CouponService {
  constructor(private db: D1Database) {}

  async createCoupon(userId: string, data: CouponCreateData): Promise<Coupon> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(
        `INSERT INTO coupons (id, user_id, code, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         RETURNING *`
      )
      .bind(id, userId, data.code, now, now)
      .first<Coupon>();

    if (!result) {
      throw new Error('Failed to create coupon');
    }

    return result;
  }

  async getCouponsByUser(userId: string): Promise<Coupon[]> {
    const result = await this.db
      .prepare('SELECT * FROM coupons WHERE user_id = ?1 ORDER BY created_at DESC')
      .bind(userId)
      .all<Coupon>();

    return result.results;
  }

  async getCouponById(id: string, userId: string): Promise<Coupon | null> {
    const result = await this.db
      .prepare('SELECT * FROM coupons WHERE id = ?1 AND user_id = ?2')
      .bind(id, userId)
      .first<Coupon>();

    return result || null;
  }

  async updateCoupon(id: string, userId: string, data: CouponUpdateData): Promise<Coupon | null> {
    const existingCoupon = await this.getCouponById(id, userId);
    if (!existingCoupon) {
      return null;
    }

    const now = new Date().toISOString();
    const usedAt = data.is_used === true ? now : (data.is_used === false ? null : existingCoupon.used_at);

    const result = await this.db
      .prepare(
        `UPDATE coupons 
         SET code = COALESCE(?3, code), 
             is_used = COALESCE(?4, is_used),
             used_at = ?5,
             updated_at = ?6
         WHERE id = ?1 AND user_id = ?2
         RETURNING *`
      )
      .bind(
        id,
        userId,
        data.code || null,
        data.is_used !== undefined ? data.is_used : null,
        usedAt,
        now
      )
      .first<Coupon>();

    return result || null;
  }

  async deleteCoupon(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM coupons WHERE id = ?1 AND user_id = ?2')
      .bind(id, userId)
      .run();

    return result.success && result.meta.changes > 0;
  }
}
