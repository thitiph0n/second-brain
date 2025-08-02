import { Coupon, CouponCreateData, CouponUpdateData } from '../types/coupon';

export class CouponService {
  constructor(private db: D1Database) {}

  private async ensureDatabaseInitialized(): Promise<void> {
    try {
      // Check if coupons table exists by attempting a simple query
      await this.db.prepare('SELECT COUNT(*) FROM coupons LIMIT 1').first();
    } catch (error) {
      console.error('Database error - coupons table may not exist:', error);
      throw new Error(`Database initialization error: ${error instanceof Error ? error.message : 'Unknown database error'}`);
    }
  }

  async createCoupon(userId: string, data: CouponCreateData): Promise<Coupon> {
    try {
      await this.ensureDatabaseInitialized();
      
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
        throw new Error('Database returned empty result when creating coupon');
      }

      return result;
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
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('SELECT * FROM coupons WHERE user_id = ?1 ORDER BY created_at DESC')
        .bind(userId)
        .all<Coupon>();

      if (!result.success) {
        throw new Error(`Database query failed: ${result.error || 'Unknown database error'}`);
      }

      return result.results || [];
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
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('SELECT * FROM coupons WHERE id = ?1 AND user_id = ?2')
        .bind(id, userId)
        .first<Coupon>();

      return result || null;
    } catch (error) {
      console.error('Error in getCouponById:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch coupon: ${error.message}`);
      }
      throw new Error('Failed to fetch coupon: Unknown error occurred');
    }
  }

  async updateCoupon(id: string, userId: string, data: CouponUpdateData): Promise<Coupon | null> {
    try {
      await this.ensureDatabaseInitialized();
      
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
      await this.ensureDatabaseInitialized();
      
      const result = await this.db
        .prepare('DELETE FROM coupons WHERE id = ?1 AND user_id = ?2')
        .bind(id, userId)
        .run();

      if (!result.success) {
        throw new Error(`Database delete failed: ${result.error || 'Unknown database error'}`);
      }

      return result.meta.changes > 0;
    } catch (error) {
      console.error('Error in deleteCoupon:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete coupon: ${error.message}`);
      }
      throw new Error('Failed to delete coupon: Unknown error occurred');
    }
  }
}
