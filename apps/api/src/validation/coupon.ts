import { z } from 'zod';

export const couponTypeSchema = z.enum(['food', 'ride']);

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(100, 'Coupon code must be less than 100 characters'),
  type: couponTypeSchema,
  expires_at: z.string().datetime().optional(),
});

export const updateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(100, 'Coupon code must be less than 100 characters').optional(),
  type: couponTypeSchema.optional(),
  expires_at: z.string().datetime().optional(),
  is_used: z.boolean().optional(),
});

export type CreateCouponRequest = z.infer<typeof createCouponSchema>;
export type UpdateCouponRequest = z.infer<typeof updateCouponSchema>;
