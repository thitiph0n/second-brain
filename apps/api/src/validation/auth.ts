// Input validation schemas for authentication

import { z } from "zod";

// User profile validation
export const userProfileSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters")
		.trim(),
	email: z.string().email("Invalid email format").optional(),
	avatar_url: z.string().url("Invalid avatar URL").optional(),
});

// Token refresh validation
export const tokenRefreshSchema = z.object({
	refresh_token: z.string().min(1, "Refresh token is required"),
});

// OAuth callback validation
export const oauthCallbackSchema = z.object({
	code: z.string().min(1, "Authorization code is required"),
	state: z.string().min(1, "State parameter is required"),
	error: z.string().optional(),
	error_description: z.string().optional(),
});

// JWT payload validation
export const jwtPayloadSchema = z.object({
	sub: z.string(),
	email: z.string().email(),
	name: z.string(),
	iat: z.number(),
	exp: z.number(),
	provider: z.string(),
});

// Session validation
export const sessionSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	token_hash: z.string(),
	expires_at: z.string(),
	created_at: z.string(),
	last_accessed: z.string(),
});

// GitHub user validation
export const githubUserSchema = z.object({
	id: z.number(),
	login: z.string(),
	name: z.string().nullable(),
	email: z.string().nullable(),
	avatar_url: z.string().url(),
});

// Rate limiting validation
export const rateLimitSchema = z.object({
	requests: z.number().min(0),
	windowMs: z.number().min(1000),
	maxRequests: z.number().min(1),
});

// OAuth state validation
export const oauthStateSchema = z.object({
	state: z.string().min(1),
	redirectUri: z.string().url(),
	timestamp: z.number(),
});

// User creation/update validation
export const userCreateSchema = z.object({
	github_id: z.number(),
	email: z.string().email(),
	name: z.string().min(1).max(100),
	avatar_url: z.string().url().optional(),
});

// Validation helper functions
export function validateUserProfile(data: unknown) {
	return userProfileSchema.parse(data);
}

export function validateTokenRefresh(data: unknown) {
	return tokenRefreshSchema.parse(data);
}

export function validateOAuthCallback(data: unknown) {
	return oauthCallbackSchema.parse(data);
}

export function validateJWTPayload(data: unknown) {
	return jwtPayloadSchema.parse(data);
}

export function validateGitHubUser(data: unknown) {
	return githubUserSchema.parse(data);
}

export function validateOAuthState(data: unknown) {
	return oauthStateSchema.parse(data);
}

export function validateUserCreate(data: unknown) {
	return userCreateSchema.parse(data);
}
