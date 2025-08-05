export type CouponType = 'food' | 'ride';

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

export interface CouponCreateData {
  code: string;
  type: CouponType;
  expiresAt?: string;
}

export interface CouponUpdateData {
  code?: string;
  type?: CouponType;
  expiresAt?: string;
  isUsed?: boolean;
}
