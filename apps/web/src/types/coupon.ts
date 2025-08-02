export interface Coupon {
  id: string;
  user_id: string;
  code: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponRequest {
  code: string;
}

export interface UpdateCouponRequest {
  code?: string;
  is_used?: boolean;
}
