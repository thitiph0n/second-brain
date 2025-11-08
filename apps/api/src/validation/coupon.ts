import { z } from "zod";

export const couponTypeSchema = z.enum(["food", "ride"]);

export const createCouponSchema = z.object({
	code: z
		.string()
		.min(1, "Coupon code is required")
		.max(100, "Coupon code must be less than 100 characters"),
	type: couponTypeSchema,
	expiresAt: z.string().datetime().optional(),
});

export const updateCouponSchema = z.object({
	code: z
		.string()
		.min(1, "Coupon code is required")
		.max(100, "Coupon code must be less than 100 characters")
		.optional(),
	type: couponTypeSchema.optional(),
	expiresAt: z.string().datetime().optional(),
	isUsed: z.boolean().optional(),
});

export const bulkDeleteCouponSchema = z.object({
	ids: z
		.array(z.string().uuid())
		.min(1, "At least one coupon ID is required")
		.max(100, "Cannot delete more than 100 coupons at once"),
});

export type CreateCouponRequest = z.infer<typeof createCouponSchema>;
export type UpdateCouponRequest = z.infer<typeof updateCouponSchema>;
export type BulkDeleteCouponRequest = z.infer<typeof bulkDeleteCouponSchema>;
