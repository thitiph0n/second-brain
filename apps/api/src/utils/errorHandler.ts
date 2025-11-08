// Utility functions for consistent error handling across API routes

import type { Context } from "hono";

export interface ErrorDetails {
	error: string;
	details?: string;
	timestamp: string;
	userId?: string;
	endpoint?: string;
	[key: string]: any;
}

export function createErrorResponse(
	c: Context,
	error: unknown,
	message: string,
	statusCode: number = 500,
	additionalInfo?: Record<string, any>,
) {
	const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
	const user = c.get("user");

	const errorDetails: ErrorDetails = {
		error: message,
		details: errorMessage,
		timestamp: new Date().toISOString(),
		endpoint: c.req.path,
		...additionalInfo,
	};

	// Add user ID if available
	if (user && user.id) {
		errorDetails.userId = user.id;
	}

	// Log the error for debugging
	console.error(`API Error [${statusCode}] ${c.req.path}:`, {
		message,
		error: errorMessage,
		userId: user?.id,
		timestamp: errorDetails.timestamp,
		...additionalInfo,
	});

	return c.json(errorDetails, statusCode as any);
}

export function createValidationErrorResponse(
	c: Context,
	error: unknown,
	additionalInfo?: Record<string, any>,
) {
	return createErrorResponse(c, error, "Invalid request data", 400, additionalInfo);
}

export function createNotFoundErrorResponse(
	c: Context,
	resourceType: string,
	resourceId?: string,
	additionalInfo?: Record<string, any>,
) {
	const message = resourceId
		? `${resourceType} with ID ${resourceId} not found`
		: `${resourceType} not found`;

	return createErrorResponse(c, new Error(message), `${resourceType} not found`, 404, {
		resourceType,
		resourceId,
		...additionalInfo,
	});
}

export function createAuthErrorResponse(
	c: Context,
	error: unknown,
	message: string = "Authentication failed",
	additionalInfo?: Record<string, any>,
) {
	return createErrorResponse(c, error, message, 401, additionalInfo);
}

export function createDatabaseErrorResponse(
	c: Context,
	error: unknown,
	operation: string,
	additionalInfo?: Record<string, any>,
) {
	return createErrorResponse(c, error, `Database operation failed: ${operation}`, 500, {
		operation,
		...additionalInfo,
	});
}
