import type { Drawing } from "@second-brain/types/drawing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://2b.thitiphon.me" : "http://localhost:8787");

console.log('useDrawingCanvas: API_BASE_URL configured as:', API_BASE_URL);

function getAuthHeaders() {
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

	const headers = {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	console.log('getAuthHeaders: Token exists:', !!token);
	if (!token) {
		console.warn('getAuthHeaders: No authentication token found!');
	}

	return headers;
}

export function useDrawingCanvas(drawingId: string) {
	const queryClient = useQueryClient();

	// Query for drawing data
	const {
		data: drawing,
		isLoading,
		isError,
		error,
	} = useQuery<Drawing>({
		queryKey: ["drawing", drawingId],
		queryFn: async () => {
			console.log('useDrawingCanvas: Fetching drawing data for ID:', drawingId);
			const response = await fetch(`${API_BASE_URL}/api/v1/drawings/${drawingId}`, {
				headers: getAuthHeaders(),
			});
			console.log('useDrawingCanvas: Response status:', response.status, response.statusText);
			if (!response.ok) {
				const errorText = await response.text();
				console.error('useDrawingCanvas: Failed to load drawing:', errorText);
				throw new Error(`Failed to load drawing: ${response.status} ${response.statusText}`);
			}
			const data = await response.json();
			console.log('useDrawingCanvas: Successfully fetched drawing data:', {
				hasData: !!data.drawing,
				hasDrawingData: !!data.drawing?.data,
				dataLength: data.drawing?.data?.length || 0
			});
			return data.drawing;
		},
		enabled: !!drawingId,
	});

	// Save drawing content mutation
	const saveMutation = useMutation({
		mutationFn: async ({ content }: { content: string }) => {
			console.log('useDrawingCanvas: saveMutation called with content length:', content.length);
			console.log('useDrawingCanvas: Drawing ID:', drawingId);
			console.log('useDrawingCanvas: API URL:', `${API_BASE_URL}/api/v1/drawings/${drawingId}`);

			const authHeaders = getAuthHeaders();
			console.log('useDrawingCanvas: Auth headers:', Object.keys(authHeaders));

			const response = await fetch(`${API_BASE_URL}/api/v1/drawings/${drawingId}`, {
				method: "PATCH",
				headers: authHeaders,
				body: JSON.stringify({ data: content }),
			});

			console.log('useDrawingCanvas: Response status:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('useDrawingCanvas: Save failed response:', errorText);
				throw new Error(`Failed to save drawing: ${response.status} ${response.statusText}`);
			}
			const data = await response.json();
			console.log('useDrawingCanvas: Save successful, received data:', data);
			return data.drawing;
		},
		onSuccess: () => {
			console.log('useDrawingCanvas: Save mutation success - invalidating query');
			// Invalidate queries to get fresh data from server
			queryClient.invalidateQueries({ queryKey: ["drawing", drawingId] });
		},
		onError: (error) => {
			console.error('useDrawingCanvas: Save mutation error:', error);
		},
	});

	// Update drawing metadata mutation
	const updateMutation = useMutation({
		mutationFn: async ({ title, description }: { title?: string; description?: string }) => {
			const response = await fetch(`${API_BASE_URL}/api/v1/drawings/${drawingId}`, {
				method: "PATCH",
				headers: getAuthHeaders(),
				body: JSON.stringify({ title, description }),
			});
			if (!response.ok) {
				throw new Error("Failed to update drawing");
			}
			const data = await response.json();
			return data.drawing;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["drawing", drawingId] });
		},
	});

	return {
		drawing,
		isLoading,
		isError,
		error,
		saveDrawing: saveMutation.mutate,
		isSaving: saveMutation.isPending,
		updateDrawing: updateMutation.mutate,
		isUpdating: updateMutation.isPending,
	};
}

interface AutoSaveOptions {
	drawingId: string;
	content: string;
	interval?: number;
	shouldAutoSave?: boolean;
}

export function useAutoSave({
	drawingId,
	content,
	interval = 30000,
	shouldAutoSave = true,
}: AutoSaveOptions) {
	const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);
	const saveIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
	const queryClient = useQueryClient();

	const handleAutoSave = useCallback(async () => {
		if (!drawingId || !shouldAutoSave) return;

		try {
			setSaveStatus("saving");

			const currentDrawing = queryClient.getQueryData(["drawing", drawingId]) as Drawing;
			if (currentDrawing?.data === content) {
				setSaveStatus("saved");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/v1/drawings/${drawingId}`, {
				method: "PATCH",
				headers: getAuthHeaders(),
				body: JSON.stringify({ data: content }),
			});

			if (!response.ok) {
				throw new Error("Failed to auto-save");
			}

			setSaveStatus("saved");
			setLastSaved(new Date());
			queryClient.invalidateQueries({ queryKey: ["drawing", drawingId] });
		} catch (err) {
			setSaveStatus("error");
			const errorMessage = err instanceof Error ? err.message : "Failed to auto-save";
			setError(errorMessage);
			toast.error("Failed to auto-save drawing");
		} finally {
			setTimeout(() => setSaveStatus("idle"), 2000);
		}
	}, [drawingId, content, shouldAutoSave, queryClient]);

	useEffect(() => {
		if (shouldAutoSave && drawingId) {
			saveIntervalRef.current = setInterval(() => {
				void handleAutoSave();
			}, interval);

			return () => {
				if (saveIntervalRef.current) {
					clearInterval(saveIntervalRef.current);
				}
			};
		}
	}, [drawingId, interval, handleAutoSave, shouldAutoSave]);

	const formatLastSaved = () => {
		if (!lastSaved) return "Never saved";
		const now = new Date();
		const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

		if (diff < 60) return "Just now";
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	};

	return {
		saveStatus,
		lastSaved,
		error,
		formatLastSaved,
		triggerSave: handleAutoSave,
	};
}

interface KeyboardShortcutsOptions {
	shortcut: string;
	callback: () => void;
	condition?: () => boolean;
}

export function useKeyboardShortcuts({
	shortcut,
	callback,
	condition = () => true,
}: KeyboardShortcutsOptions) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Parse shortcut string (e.g., "Cmd+S" or "Ctrl+S")
			const parts = shortcut.split("+");
			const key = parts[parts.length - 1].toLowerCase();
			const hasCtrl = parts.includes("Ctrl");
			const hasCmd = parts.includes("Cmd");
			const hasShift = parts.includes("Shift");
			const hasAlt = parts.includes("Alt");

			const isCtrlPressed = event.ctrlKey || event.metaKey;
			const isShiftPressed = event.shiftKey;
			const isAltPressed = event.altKey;

			const isCorrectKey = event.key.toLowerCase() === key;
			const isCorrectModifiers =
				(hasCtrl && isCtrlPressed) ||
				(hasCmd && isCtrlPressed && hasShift === isShiftPressed && hasAlt === isAltPressed);

			if (isCorrectKey && isCorrectModifiers && condition()) {
				event.preventDefault();
				callback();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [shortcut, callback, condition]);
}
