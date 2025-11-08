import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuth } from "../hooks";
import { useAuthStore } from "../store";

describe("Authentication Store", () => {
	beforeEach(() => {
		// Clear store before each test
		useAuthStore.getState().logout();
	});

	it("should initialize with default state", () => {
		const { result } = renderHook(() => useAuth());

		expect(result.current.isAuthenticated).toBe(false);
		expect(result.current.user).toBeNull();
		expect(result.current.accessToken).toBeNull();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("should login successfully", () => {
		const { result } = renderHook(() => useAuth());

		const mockUser = {
			id: "1",
			email: "test@example.com",
			name: "Test User",
			avatarUrl: "https://example.com/avatar.jpg",
		};

		act(() => {
			useAuthStore.getState().login(mockUser, "access-token", "refresh-token");
		});

		expect(result.current.isAuthenticated).toBe(true);
		expect(result.current.user).toEqual(mockUser);
		expect(result.current.accessToken).toBe("access-token");
		expect(result.current.error).toBeNull();
	});

	it("should logout successfully", () => {
		const { result } = renderHook(() => useAuth());

		const mockUser = {
			id: "1",
			email: "test@example.com",
			name: "Test User",
			avatarUrl: "https://example.com/avatar.jpg",
		};

		// Login first
		act(() => {
			useAuthStore.getState().login(mockUser, "access-token", "refresh-token");
		});

		expect(result.current.isAuthenticated).toBe(true);

		// Then logout
		act(() => {
			useAuthStore.getState().logout();
		});

		expect(result.current.isAuthenticated).toBe(false);
		expect(result.current.user).toBeNull();
		expect(result.current.accessToken).toBeNull();
	});

	it("should handle loading state", () => {
		const { result } = renderHook(() => useAuth());

		act(() => {
			useAuthStore.getState().setLoading(true);
		});

		expect(result.current.isLoading).toBe(true);

		act(() => {
			useAuthStore.getState().setLoading(false);
		});

		expect(result.current.isLoading).toBe(false);
	});

	it("should handle error state", () => {
		const { result } = renderHook(() => useAuth());

		act(() => {
			useAuthStore.getState().setError("Test error");
		});

		expect(result.current.error).toBe("Test error");

		act(() => {
			useAuthStore.getState().setError(null);
		});

		expect(result.current.error).toBeNull();
	});
});
