// Authentication service for user management

import type { AuthSession, GitHubUser, JWTPayload, User } from "@second-brain/types/auth";
import { generateJWT, generateRandomId, hashToken, verifyJWT } from "../utils/crypto";

export class AuthService {
	private db: D1Database;
	private kv: KVNamespace;
	private jwtSecret: string;

	constructor(db: D1Database, kv: KVNamespace, jwtSecret: string) {
		this.db = db;
		this.kv = kv;
		this.jwtSecret = jwtSecret;
	}

	async createOrUpdateUser(githubUser: GitHubUser): Promise<User> {
		const userId = generateRandomId();
		const now = new Date().toISOString();

		// Check if user exists
		const existingUser = await this.db
			.prepare("SELECT * FROM users WHERE github_id = ?")
			.bind(githubUser.id)
			.first<User>();

		if (existingUser) {
			// Update existing user
			await this.db
				.prepare(`
        UPDATE users 
        SET email = ?, name = ?, avatar_url = ?, updated_at = ?
        WHERE id = ?
      `)
				.bind(githubUser.email, githubUser.name, githubUser.avatar_url, now, existingUser.id)
				.run();

			return {
				...existingUser,
				email: githubUser.email,
				name: githubUser.name,
				avatar_url: githubUser.avatar_url,
				updated_at: now,
			};
		} else {
			// Create new user
			await this.db
				.prepare(`
        INSERT INTO users (id, github_id, email, name, avatar_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
				.bind(
					userId,
					githubUser.id,
					githubUser.email,
					githubUser.name,
					githubUser.avatar_url,
					now,
					now,
				)
				.run();

			// Create OAuth provider record
			await this.db
				.prepare(`
        INSERT INTO oauth_providers (id, user_id, provider, provider_user_id, provider_email, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
				.bind(generateRandomId(), userId, "github", githubUser.id.toString(), githubUser.email, now)
				.run();

			return {
				id: userId,
				github_id: githubUser.id,
				email: githubUser.email,
				name: githubUser.name,
				avatar_url: githubUser.avatar_url,
				created_at: now,
				updated_at: now,
			};
		}
	}

	async createSession(
		user: User,
	): Promise<{ accessToken: string; refreshToken: string; session: AuthSession }> {
		const sessionId = generateRandomId();
		const accessToken = await generateJWT(
			{
				sub: user.id,
				email: user.email,
				name: user.name,
				provider: "github",
			} as JWTPayload,
			this.jwtSecret,
			3600, // 1 hour
		);

		const refreshToken = generateRandomId();
		const tokenHash = await hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
		const now = new Date().toISOString();

		const session: AuthSession = {
			id: sessionId,
			user_id: user.id,
			token_hash: tokenHash,
			expires_at: expiresAt,
			created_at: now,
			last_accessed: now,
		};

		await this.db
			.prepare(`
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
			.bind(sessionId, user.id, tokenHash, expiresAt, now, now)
			.run();

		// Store session in KV for fast access
		await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
			expirationTtl: 30 * 24 * 60 * 60, // 30 days
		});

		return { accessToken, refreshToken, session };
	}

	async validateToken(token: string): Promise<{ user: User; session: AuthSession } | null> {
		try {
			const payload = await verifyJWT(token, this.jwtSecret);

			const user = await this.db
				.prepare("SELECT * FROM users WHERE id = ?")
				.bind(payload.sub)
				.first<User>();

			if (!user) {
				return null;
			}

			// Get active session
			const session = await this.db
				.prepare(
					'SELECT * FROM auth_sessions WHERE user_id = ? AND expires_at > datetime("now") ORDER BY last_accessed DESC LIMIT 1',
				)
				.bind(user.id)
				.first<AuthSession>();

			if (!session) {
				return null;
			}

			// Update last accessed
			await this.updateSessionAccess(session.id);

			return { user, session };
		} catch (error) {
			console.error("Token validation error:", error);
			return null;
		}
	}

	async refreshToken(
		refreshToken: string,
	): Promise<{ accessToken: string; refreshToken: string } | null> {
		const tokenHash = await hashToken(refreshToken);

		const session = await this.db
			.prepare('SELECT * FROM auth_sessions WHERE token_hash = ? AND expires_at > datetime("now")')
			.bind(tokenHash)
			.first<AuthSession>();

		if (!session) {
			return null;
		}

		const user = await this.db
			.prepare("SELECT * FROM users WHERE id = ?")
			.bind(session.user_id)
			.first<User>();

		if (!user) {
			return null;
		}

		// Generate new tokens
		const newAccessToken = await generateJWT(
			{
				sub: user.id,
				email: user.email,
				name: user.name,
				provider: "github",
			} as JWTPayload,
			this.jwtSecret,
			3600, // 1 hour
		);

		const newRefreshToken = generateRandomId();
		const newTokenHash = await hashToken(newRefreshToken);
		const now = new Date().toISOString();

		// Update session with new refresh token
		await this.db
			.prepare(`
      UPDATE auth_sessions 
      SET token_hash = ?, last_accessed = ?
      WHERE id = ?
    `)
			.bind(newTokenHash, now, session.id)
			.run();

		// Update KV cache
		const updatedSession = { ...session, token_hash: newTokenHash, last_accessed: now };
		await this.kv.put(`session:${session.id}`, JSON.stringify(updatedSession), {
			expirationTtl: 30 * 24 * 60 * 60, // 30 days
		});

		return { accessToken: newAccessToken, refreshToken: newRefreshToken };
	}

	async invalidateSession(sessionId: string): Promise<void> {
		await this.db.prepare("DELETE FROM auth_sessions WHERE id = ?").bind(sessionId).run();

		await this.kv.delete(`session:${sessionId}`);
	}

	async invalidateAllUserSessions(userId: string): Promise<void> {
		const sessions = await this.db
			.prepare("SELECT id FROM auth_sessions WHERE user_id = ?")
			.bind(userId)
			.all<{ id: string }>();

		await this.db.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(userId).run();

		// Clean up KV cache
		for (const session of sessions.results) {
			await this.kv.delete(`session:${session.id}`);
		}
	}

	async cleanupExpiredSessions(): Promise<void> {
		const expiredSessions = await this.db
			.prepare('SELECT id FROM auth_sessions WHERE expires_at <= datetime("now")')
			.all<{ id: string }>();

		await this.db.prepare('DELETE FROM auth_sessions WHERE expires_at <= datetime("now")').run();

		// Clean up KV cache
		for (const session of expiredSessions.results) {
			await this.kv.delete(`session:${session.id}`);
		}
	}

	private async updateSessionAccess(sessionId: string): Promise<void> {
		const now = new Date().toISOString();
		await this.db
			.prepare("UPDATE auth_sessions SET last_accessed = ? WHERE id = ?")
			.bind(now, sessionId)
			.run();
	}
}
