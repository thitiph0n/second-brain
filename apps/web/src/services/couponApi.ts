import type { Coupon, CreateCouponRequest, UpdateCouponRequest } from '@/types/coupon';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError(401, 'No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, errorData.error || 'Request failed');
  }

  return response.json();
}

export const couponApi = {
  // Get all coupons for the authenticated user
  async getCoupons(): Promise<{ coupons: Coupon[] }> {
    return fetchWithAuth('/coupons');
  },

  // Create a new coupon
  async createCoupon(data: CreateCouponRequest): Promise<{ coupon: Coupon }> {
    return fetchWithAuth('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get a specific coupon
  async getCoupon(id: string): Promise<{ coupon: Coupon }> {
    return fetchWithAuth(`/coupons/${id}`);
  },

  // Update a coupon (e.g., mark as used)
  async updateCoupon(id: string, data: UpdateCouponRequest): Promise<{ coupon: Coupon }> {
    return fetchWithAuth(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a coupon
  async deleteCoupon(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/coupons/${id}`, {
      method: 'DELETE',
    });
  },

  // Mark a coupon as used
  async markAsUsed(id: string): Promise<{ coupon: Coupon }> {
    return this.updateCoupon(id, { is_used: true });
  },

  // Mark a coupon as unused
  async markAsUnused(id: string): Promise<{ coupon: Coupon }> {
    return this.updateCoupon(id, { is_used: false });
  },
};

export { ApiError };