import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { CouponService } from "../services/coupon";
import type { AuthSession, User } from "../types/auth";
import {
	createAuthErrorResponse,
	createErrorResponse,
	createNotFoundErrorResponse,
	createValidationErrorResponse,
} from "../utils/errorHandler";
import {
	bulkDeleteCouponSchema,
	createCouponSchema,
	updateCouponSchema,
} from "../validation/coupon";

interface Env {
	DB: D1Database;
	CACHE: KVNamespace;
	JWT_SECRET: string;
	FRONTEND_URL: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
}

const couponRoutes = new Hono<{
	Bindings: Env;
	Variables: { user: User; session: AuthSession };
}>();

// Apply auth middleware to all coupon routes
couponRoutes.use("*", requireAuth());

// GET /api/v1/coupons - Get all coupons for the authenticated user
couponRoutes.get("/", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const couponService = new CouponService(c.env.DB);
		const coupons = await couponService.getCouponsByUser(user.id);

		return c.json({ coupons });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch coupons");
	}
});

// POST /api/v1/coupons - Create a new coupon
couponRoutes.post("/", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();

		// Validate request body
		const validatedData = createCouponSchema.parse(body);

		const couponService = new CouponService(c.env.DB);
		const coupon = await couponService.createCoupon(user.id, validatedData);

		return c.json({ coupon }, 201);
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to create coupon");
	}
});

// GET /api/v1/coupons/:id - Get a specific coupon
couponRoutes.get("/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");

		const couponService = new CouponService(c.env.DB);
		const coupon = await couponService.getCouponById(id, user.id);

		if (!coupon) {
			return createNotFoundErrorResponse(c, "Coupon", id);
		}

		return c.json({ coupon });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to fetch coupon", 500, {
			couponId: c.req.param("id"),
		});
	}
});

// PUT /api/v1/coupons/:id - Update a coupon (e.g., mark as used)
couponRoutes.put("/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");
		const body = await c.req.json();

		// Validate request body
		const validatedData = updateCouponSchema.parse(body);

		const couponService = new CouponService(c.env.DB);
		const updatedCoupon = await couponService.updateCoupon(id, user.id, validatedData);

		if (!updatedCoupon) {
			return createNotFoundErrorResponse(c, "Coupon", id);
		}

		return c.json({ coupon: updatedCoupon });
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to update coupon", 500, {
			couponId: c.req.param("id"),
		});
	}
});

// DELETE /api/v1/coupons/:id - Delete a coupon
couponRoutes.delete("/:id", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const id = c.req.param("id");

		const couponService = new CouponService(c.env.DB);
		const deleted = await couponService.deleteCoupon(id, user.id);

		if (!deleted) {
			return createNotFoundErrorResponse(c, "Coupon", id);
		}

		return c.json({ message: "Coupon deleted successfully" });
	} catch (error) {
		return createErrorResponse(c, error, "Failed to delete coupon", 500, {
			couponId: c.req.param("id"),
		});
	}
});

// POST /api/v1/coupons/bulk-delete - Delete multiple coupons
couponRoutes.post("/bulk-delete", async (c) => {
	try {
		const user = c.get("user");
		if (!user) {
			return createAuthErrorResponse(
				c,
				new Error("User context not found"),
				"Authentication middleware did not set user context",
			);
		}

		const body = await c.req.json();

		// Validate request body
		const validatedData = bulkDeleteCouponSchema.parse(body);

		const couponService = new CouponService(c.env.DB);
		const deletedCount = await couponService.bulkDeleteCoupons(validatedData.ids, user.id);

		return c.json({
			message: `Successfully deleted ${deletedCount} coupon(s)`,
			deletedCount,
			requestedCount: validatedData.ids.length,
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("parse")) {
			return createValidationErrorResponse(c, error);
		}

		return createErrorResponse(c, error, "Failed to bulk delete coupons");
	}
});

export default couponRoutes;
