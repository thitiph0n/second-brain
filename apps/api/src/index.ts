import { Hono } from "hono";
import { cors } from "hono/cors";
import assetsRoutes from "./routes/assets";
import authRoutes from "./routes/auth";
import couponRoutes from "./routes/coupon";
import drawingsRoutes from "./routes/drawings";
import mealTrackerRoutes from "./routes/meal-tracker";
import tripPlannerRoutes from "./routes/trip-planner";
import { createErrorResponse } from "./utils/errorHandler";

interface Env {
	ASSETS: Fetcher;
	DB: D1Database;
	CACHE: KVNamespace;
	DRAWING_ASSETS: R2Bucket;
	ENVIRONMENT: string;
	FRONTEND_URL: string;
	JWT_SECRET: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
	"*",
	cors({
		origin: (origin, c) => {
			const env = c.env.FRONTEND_URL;
			const allowedOrigins = [
				"http://localhost:3000",
				"http://localhost:5173",
				"http://localhost:8787",
				env,
			];
			return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
		},
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.get("/api/health", (c) => {
	try {
		return c.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			environment: c.env.ENVIRONMENT,
			database: c.env.DB ? "connected" : "not configured",
			cache: c.env.CACHE ? "connected" : "not configured",
			drawing_assets: c.env.DRAWING_ASSETS ? "connected" : "not configured",
		});
	} catch (error) {
		return createErrorResponse(c, error, "Health check failed");
	}
});

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/coupons", couponRoutes);
app.route("/api/v1/drawings", drawingsRoutes);
app.route("/api/v1/meal-tracker", mealTrackerRoutes);
app.route("/api/v1/trip-planner", tripPlannerRoutes);
app.route("/api/v1/assets", assetsRoutes);

// 404 handler for API routes
app.notFound((c) => {
	if (c.req.path.startsWith("/api/")) {
		return c.json(
			{
				error: "API endpoint not found",
				details: `The endpoint ${c.req.method} ${c.req.path} does not exist`,
				timestamp: new Date().toISOString(),
			},
			404,
		);
	}

	return c.env.ASSETS.fetch(new Request("http://localhost/index.html"));
});

app.onError((error, c) => {
	console.error("Uncaught API error:", error);
	return createErrorResponse(c, error, "Internal server error", 500, {
		uncaught: true,
	});
});

export default app;
