export type CouponType = 'food' | 'ride';

export interface Coupon {
  id: string;
  user_id: string;
  code: string;
  type: CouponType;
  expires_at?: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponRequest {
  code: string;
  type: CouponType;
  expires_at?: string;
}

export interface UpdateCouponRequest {
  code?: string;
  type?: CouponType;
  expires_at?: string;
  is_used?: boolean;
}
