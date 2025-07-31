import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(100, 'Coupon code must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export const updateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(100, 'Coupon code must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  is_used: z.boolean().optional(),
});

export type CreateCouponRequest = z.infer<typeof createCouponSchema>;
export type UpdateCouponRequest = z.infer<typeof updateCouponSchema>;