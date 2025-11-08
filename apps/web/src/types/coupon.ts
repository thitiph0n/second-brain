export type CouponType = "food" | "ride";

export interface Coupon {
	id: string;
	userId: string;
	code: string;
	type: CouponType;
	expiresAt?: string;
	isUsed: boolean;
	usedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCouponRequest {
	code: string;
	type: CouponType;
	expiresAt?: string;
}

export interface UpdateCouponRequest {
	code?: string;
	type?: CouponType;
	expiresAt?: string;
	isUsed?: boolean;
}
