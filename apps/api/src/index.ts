import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth";
import couponRoutes from "./routes/coupon";
import { createErrorResponse } from "./utils/errorHandler";

interface Env {
	ASSETS: Fetcher;
	DB: D1Database;
	CACHE: KVNamespace;
	ENVIRONMENT: string;
	FRONTEND_URL: string;
	JWT_SECRET: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
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
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

// API Routes (before static assets)
app.get("/api/health", (c) => {
	try {
		return c.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			environment: c.env.ENVIRONMENT,
			database: c.env.DB ? "connected" : "not configured",
			cache: c.env.CACHE ? "connected" : "not configured",
		});
	} catch (error) {
		return createErrorResponse(c, error, "Health check failed");
	}
});

app.get("/api/v1/test", (c) => {
	try {
		return c.json({
			message: "Second Brain API is working!",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
		});
	} catch (error) {
		return createErrorResponse(c, error, "Test endpoint failed");
	}
});

// Authentication routes
app.route("/api/v1/auth", authRoutes);

// Coupon routes
app.route("/api/v1/coupons", couponRoutes);

// Add more API routes here
// app.route('/api/v1/notes', notesRouter);
// app.route('/api/v1/todos', todosRouter);
// ... other API routes

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
	// For non-API routes, serve index.html (SPA fallback)
	return c.env.ASSETS.fetch(new Request("http://localhost/index.html"));
});

// Global error handler for uncaught errors
app.onError((error, c) => {
	console.error("Uncaught API error:", error);
	return createErrorResponse(c, error, "Internal server error", 500, {
		uncaught: true,
	});
});

export default app;
