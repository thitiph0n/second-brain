import type { Coupon, CreateCouponRequest, UpdateCouponRequest } from "@second-brain/types/coupon";

const API_BASE_URL =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.PROD ? "https://2b.thitiphon.me" : "http://localhost:8787");

class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
	// Get token from Zustand auth store
	const authData = localStorage.getItem("auth-storage");
	let token = null;

	if (authData) {
		try {
			const parsed = JSON.parse(authData);
			token = parsed.state?.accessToken;
		} catch (_e) {
			// Invalid JSON in storage
		}
	}

	if (!token) {
		throw new ApiError(401, "No authentication token found");
	}

	const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});

	if (!response.ok) {
		let errorData: { error: string; details?: string; timestamp?: string };
		try {
			errorData = await response.json();
		} catch (_e) {
			errorData = { error: "Failed to parse error response" };
		}

		// Create detailed error message
		let errorMessage = errorData.error || "Request failed";
		if (errorData.details) {
			errorMessage += ` - ${errorData.details}`;
		}
		if (errorData.timestamp) {
			errorMessage += ` (${errorData.timestamp})`;
		}

		throw new ApiError(response.status, errorMessage);
	}

	return response.json();
}

export const couponApi = {
	// Get all coupons for the authenticated user
	async getCoupons(): Promise<{ coupons: Coupon[] }> {
		return fetchWithAuth("/coupons");
	},

	// Create a new coupon
	async createCoupon(data: CreateCouponRequest): Promise<{ coupon: Coupon }> {
		return fetchWithAuth("/coupons", {
			method: "POST",
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
			method: "PUT",
			body: JSON.stringify(data),
		});
	},

	// Delete a coupon
	async deleteCoupon(id: string): Promise<{ message: string }> {
		return fetchWithAuth(`/coupons/${id}`, {
			method: "DELETE",
		});
	},

	// Bulk delete multiple coupons
	async bulkDeleteCoupons(
		ids: string[],
	): Promise<{ message: string; deletedCount: number; requestedCount: number }> {
		return fetchWithAuth("/coupons/bulk-delete", {
			method: "POST",
			body: JSON.stringify({ ids }),
		});
	},

	// Mark a coupon as used
	async markAsUsed(id: string): Promise<{ coupon: Coupon }> {
		return this.updateCoupon(id, { isUsed: true });
	},

	// Mark a coupon as unused
	async markAsUnused(id: string): Promise<{ coupon: Coupon }> {
		return this.updateCoupon(id, { isUsed: false });
	},
};

export { ApiError };
