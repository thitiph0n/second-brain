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

export interface CouponCreateData {
  code: string;
  type: CouponType;
  expires_at?: string;
}

export interface CouponUpdateData {
  code?: string;
  type?: CouponType;
  expires_at?: string;
  is_used?: boolean;
}
