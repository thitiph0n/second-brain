// OAuth service for GitHub authentication

import type { GitHubUser, OAuthState } from "../types/auth";
import { generateRandomId, generateRandomState } from "../utils/crypto";

export class GitHubOAuthService {
	private clientId: string;
	private clientSecret: string;
	private redirectUri: string;

	constructor(clientId: string, clientSecret: string, redirectUri: string) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.redirectUri = redirectUri;
	}

	generateAuthUrl(): { url: string; state: string } {
		const state = generateRandomState();
		const params = new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope: "user:email",
			state: state,
			response_type: "code",
		});

		const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
		return { url, state };
	}

	async exchangeCodeForToken(code: string): Promise<string> {
		const params = new URLSearchParams({
			client_id: this.clientId,
			client_secret: this.clientSecret,
			code: code,
			redirect_uri: this.redirectUri,
		});

		const response = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params.toString(),
		});

		if (!response.ok) {
			throw new Error(`GitHub token exchange failed: ${response.status}`);
		}

		const data = (await response.json()) as any;

		if (data.error) {
			throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
		}

		return data.access_token as string;
	}

	async getUserInfo(accessToken: string): Promise<GitHubUser> {
		const response = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `token ${accessToken}`,
				Accept: "application/json",
				"User-Agent": "Second-Brain-App",
			},
		});

		if (!response.ok) {
			throw new Error(`GitHub user info failed: ${response.status}`);
		}

		const userData = (await response.json()) as any;

		// Get user email if not public
		if (!userData.email) {
			const emailResponse = await fetch("https://api.github.com/user/emails", {
				headers: {
					Authorization: `token ${accessToken}`,
					Accept: "application/json",
					"User-Agent": "Second-Brain-App",
				},
			});

			if (emailResponse.ok) {
				const emails = (await emailResponse.json()) as any[];
				const primaryEmail = emails.find((email: any) => email.primary);
				if (primaryEmail) {
					userData.email = primaryEmail.email;
				}
			}
		}

		return {
			id: userData.id,
			login: userData.login,
			name: userData.name || userData.login,
			email: userData.email || "",
			avatar_url: userData.avatar_url,
		};
	}

	async storeOAuthState(kv: KVNamespace, state: string, redirectUri: string): Promise<void> {
		const stateData: OAuthState = {
			state,
			redirectUri,
			timestamp: Date.now(),
		};

		await kv.put(`oauth_state:${state}`, JSON.stringify(stateData), {
			expirationTtl: 600, // 10 minutes
		});
	}

	async validateOAuthState(kv: KVNamespace, state: string): Promise<OAuthState | null> {
		const stateData = await kv.get(`oauth_state:${state}`);
		if (!stateData) {
			return null;
		}

		const oauthState: OAuthState = JSON.parse(stateData);

		// Check if state is expired (10 minutes)
		if (Date.now() - oauthState.timestamp > 10 * 60 * 1000) {
			await kv.delete(`oauth_state:${state}`);
			return null;
		}

		// Clean up used state
		await kv.delete(`oauth_state:${state}`);

		return oauthState;
	}
}
