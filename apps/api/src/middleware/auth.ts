// Authentication middleware for protected routes

import type { Context, Next } from "hono";
import { AuthService } from "../services/auth";
import type { AuthSession, User } from "@second-brain/types/auth";

interface Env {
	DB: D1Database;
	CACHE: KVNamespace;
	JWT_SECRET: string;
	FRONTEND_URL: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
}

export function createAuthMiddleware() {
	return async (
		c: Context<{
			Bindings: Env;
			Variables: { user: User; session: AuthSession };
		}>,
		next: Next,
	) => {
		const authHeader = c.req.header("Authorization");

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return c.json({ error: "Missing or invalid authorization header" }, 401);
		}

		const token = authHeader.substring(7);
		const authService = new AuthService(c.env.DB, c.env.CACHE, c.env.JWT_SECRET);

		try {
			const authData = await authService.validateToken(token);

			if (!authData) {
				return c.json({ error: "Invalid or expired token" }, 401);
			}

			// Set user context for subsequent middleware/handlers
			c.set("user", authData.user);
			c.set("session", authData.session);

			await next();
		} catch (error) {
			console.error("Authentication error:", error);
			return c.json({ error: "Authentication failed" }, 401);
		}
	};
}

export function extractBearerToken(c: Context): string | null {
	const authHeader = c.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	return authHeader.substring(7);
}

export function requireAuth() {
	return createAuthMiddleware();
}

// Optional auth middleware - doesn't fail if no token provided
export function optionalAuth() {
	return async (
		c: Context<{
			Bindings: Env;
			Variables: { user?: User; session?: AuthSession };
		}>,
		next: Next,
	) => {
		const authHeader = c.req.header("Authorization");

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			const authService = new AuthService(c.env.DB, c.env.CACHE, c.env.JWT_SECRET);

			try {
				const authData = await authService.validateToken(token);

				if (authData) {
					c.set("user", authData.user);
					c.set("session", authData.session);
				}
			} catch (error) {
				console.error("Optional auth error:", error);
				// Continue without auth context
			}
		}

		await next();
	};
}

// Rate limiting middleware for auth endpoints
export function createRateLimiter(maxRequests: number, windowMs: number) {
	return async (c: Context<{ Bindings: Env; Variables: any }>, next: Next) => {
		const clientIP =
			c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
		const key = `rate_limit:${clientIP}`;

		const current = await c.env.CACHE.get(key);
		const requests = current ? parseInt(current) : 0;

		if (requests >= maxRequests) {
			return c.json(
				{
					error: "Too many requests",
					message: "Rate limit exceeded. Please try again later.",
				},
				429,
			);
		}

		// Increment counter
		await c.env.CACHE.put(key, (requests + 1).toString(), {
			expirationTtl: Math.ceil(windowMs / 1000),
		});

		await next();
	};
}

// CORS middleware specific to auth endpoints
export function createAuthCors() {
	return async (c: Context<{ Bindings: Env; Variables: any }>, next: Next) => {
		const origin = c.req.header("Origin");
		const allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:5173",
			c.env.FRONTEND_URL || "https://2b.thitiphon.me",
		];

		if (origin && allowedOrigins.includes(origin)) {
			c.header("Access-Control-Allow-Origin", origin);
		}

		c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
		c.header("Access-Control-Allow-Credentials", "true");

		if (c.req.method === "OPTIONS") {
			return new Response("", { status: 204 });
		}

		await next();
	};
}
