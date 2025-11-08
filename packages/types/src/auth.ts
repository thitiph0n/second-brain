export interface User {
	id: string;
	github_id: number;
	email: string;
	name: string;
	avatar_url?: string;
	created_at: string;
	updated_at: string;
}

export interface OAuthProvider {
	id: string;
	user_id: string;
	provider: string;
	provider_user_id: string;
	provider_email: string;
	created_at: string;
}

export interface AuthSession {
	id: string;
	user_id: string;
	token_hash: string;
	expires_at: string;
	created_at: string;
	last_accessed: string;
}

export interface JWTPayload {
	sub: string;
	email: string;
	name: string;
	iat: number;
	exp: number;
	provider: string;
}

export interface GitHubUser {
	id: number;
	login: string;
	name: string;
	email: string;
	avatar_url: string;
}

export interface OAuthState {
	state: string;
	redirectUri: string;
	timestamp: number;
}

export interface AuthContext {
	user: User;
	session: AuthSession;
}
