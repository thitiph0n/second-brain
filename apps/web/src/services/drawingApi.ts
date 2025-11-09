import type {
	Drawing,
	DrawingFormData,
	DrawingFormDataWithContent,
} from "@second-brain/types/drawing";

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

export const drawingApi = {
	// Get drawing statistics
	async getDrawingStats(): Promise<{
		totalDrawings: number;
		totalFolders: number;
		recentDrawings: Drawing[];
	}> {
		return fetchWithAuth("/drawings/stats");
	},

	// Get all drawings for the authenticated user
	async getDrawings(parentId?: string, searchQuery?: string): Promise<{ drawings: Drawing[] }> {
		if (parentId) {
			return fetchWithAuth(`/drawings/folder/${parentId}`);
		}
		if (searchQuery) {
			return fetchWithAuth(`/drawings?search=${encodeURIComponent(searchQuery)}`);
		}
		return fetchWithAuth("/drawings");
	},

	// Create a new drawing
	async createDrawing(data: DrawingFormDataWithContent): Promise<{ drawing: Drawing }> {
		return fetchWithAuth("/drawings", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	// Get a specific drawing
	async getDrawing(id: string): Promise<{ drawing: Drawing }> {
		return fetchWithAuth(`/drawings/${id}`);
	},

	// Get the full path (breadcrumb) for a drawing
	async getDrawingPath(id: string): Promise<{ path: Drawing[] }> {
		return fetchWithAuth(`/drawings/${id}/path`);
	},

	// Update a drawing (metadata and/or content)
	async updateDrawing(id: string, data: Partial<DrawingFormData & { data: string }>): Promise<{ drawing: Drawing }> {
		return fetchWithAuth(`/drawings/${id}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	},

	// Delete a drawing
	async deleteDrawing(id: string): Promise<{ message: string }> {
		return fetchWithAuth(`/drawings/${id}`, {
			method: "DELETE",
		});
	},

	// Upload asset for drawing
	async uploadAsset(file: File, type: "image" | "document"): Promise<{ url: string; key: string }> {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);

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

		const response = await fetch(`${API_BASE_URL}/api/v1/drawings/assets`, {
			method: "POST",
			body: formData,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			let errorData: { error: string; details?: string; timestamp?: string };
			try {
				errorData = await response.json();
			} catch (_e) {
				errorData = { error: "Failed to parse error response" };
			}

			let errorMessage = errorData.error || "Upload failed";
			if (errorData.details) {
				errorMessage += ` - ${errorData.details}`;
			}

			throw new ApiError(response.status, errorMessage);
		}

		return response.json();
	},

	// Archive a drawing
	async archiveDrawing(id: string): Promise<{ drawing: Drawing }> {
		return fetchWithAuth(`/drawings/${id}/archive`, {
			method: "PUT",
		});
	},

	// Unarchive a drawing
	async unarchiveDrawing(id: string): Promise<{ drawing: Drawing }> {
		return fetchWithAuth(`/drawings/${id}/unarchive`, {
			method: "PUT",
		});
	},
};

export { ApiError };
