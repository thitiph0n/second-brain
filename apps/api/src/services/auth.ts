// Authentication service for user management

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, gt, lt, desc } from 'drizzle-orm';
import type { GitHubUser, JWTPayload } from '@second-brain/types/auth';
import type { User as LegacyUser, AuthSession as LegacyAuthSession } from '@second-brain/types/auth';
import { users, oauthProviders, authSessions } from '@second-brain/database/schema';
import { generateJWT, generateRandomId, hashToken, verifyJWT } from '../utils/crypto';

// Adapter function to convert Drizzle User to legacy User type
function adaptDrizzleUserToLegacy(drizzleUser: any): LegacyUser {
	return {
		id: drizzleUser.id,
		github_id: drizzleUser.githubId,
		email: drizzleUser.email,
		name: drizzleUser.name,
		avatar_url: drizzleUser.avatarUrl || undefined,
		created_at: drizzleUser.createdAt || '',
		updated_at: drizzleUser.updatedAt || '',
	};
}

// Adapter function to convert Drizzle AuthSession to legacy AuthSession type
function adaptDrizzleSessionToLegacy(drizzleSession: any): LegacyAuthSession {
	return {
		id: drizzleSession.id,
		user_id: drizzleSession.userId,
		token_hash: drizzleSession.tokenHash,
		expires_at: drizzleSession.expiresAt,
		created_at: drizzleSession.createdAt || '',
		last_accessed: drizzleSession.lastAccessed || '',
	};
}

export class AuthService {
	private db: ReturnType<typeof drizzle>;
	private kv: KVNamespace;
	private jwtSecret: string;

	constructor(d1Database: D1Database, kv: KVNamespace, jwtSecret: string) {
		this.db = drizzle(d1Database);
		this.kv = kv;
		this.jwtSecret = jwtSecret;
	}

	async createOrUpdateUser(githubUser: GitHubUser): Promise<LegacyUser> {
		const userId = generateRandomId();
		const now = new Date().toISOString();

		// Check if user exists
		const existingUser = await this.db
			.select()
			.from(users)
			.where(eq(users.githubId, githubUser.id))
			.get();

		if (existingUser) {
			// Update existing user
			await this.db
				.update(users)
				.set({
					email: githubUser.email,
					name: githubUser.name,
					avatarUrl: githubUser.avatar_url,
					updatedAt: now,
				})
				.where(eq(users.id, existingUser.id));

				const updatedUser = {
				id: existingUser.id,
				githubId: existingUser.githubId,
				email: githubUser.email,
				name: githubUser.name,
				avatarUrl: githubUser.avatar_url,
				createdAt: existingUser.createdAt,
				updatedAt: now,
			};
			return adaptDrizzleUserToLegacy(updatedUser);
		} else {
			// Create new user
			await this.db.insert(users).values({
				id: userId,
				githubId: githubUser.id,
				email: githubUser.email,
				name: githubUser.name,
				avatarUrl: githubUser.avatar_url,
				createdAt: now,
				updatedAt: now,
			});

			// Create OAuth provider record
			await this.db.insert(oauthProviders).values({
				id: generateRandomId(),
				userId,
				provider: 'github',
				providerUserId: githubUser.id.toString(),
				providerEmail: githubUser.email,
				createdAt: now,
			});

			const newUser = {
				id: userId,
				githubId: githubUser.id,
				email: githubUser.email,
				name: githubUser.name,
				avatarUrl: githubUser.avatar_url,
				createdAt: now,
				updatedAt: now,
			};
			return adaptDrizzleUserToLegacy(newUser);
		}
	}

	async createSession(
		user: LegacyUser,
	): Promise<{ accessToken: string; refreshToken: string; session: LegacyAuthSession }> {
		const sessionId = generateRandomId();
		const accessToken = await generateJWT(
			{
				sub: user.id,
				email: user.email,
				name: user.name,
				provider: 'github',
			} as JWTPayload,
			this.jwtSecret,
			3600, // 1 hour
		);

		const refreshToken = generateRandomId();
		const tokenHash = await hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
		const now = new Date().toISOString();

		const sessionData = {
			id: sessionId,
			userId: user.id,
			tokenHash: tokenHash,
			expiresAt: expiresAt,
			createdAt: now,
			lastAccessed: now,
		};

		await this.db.insert(authSessions).values(sessionData);

		const session = adaptDrizzleSessionToLegacy(sessionData);

		// Store session in KV for fast access
		await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
			expirationTtl: 30 * 24 * 60 * 60, // 30 days
		});

		return { accessToken, refreshToken, session };
	}

	async validateToken(token: string): Promise<{ user: LegacyUser; session: LegacyAuthSession } | null> {
		try {
			const payload = await verifyJWT(token, this.jwtSecret);

			const user = await this.db
				.select()
				.from(users)
				.where(eq(users.id, payload.sub))
				.get();

			if (!user) {
				return null;
			}

			// Get active session
			const session = await this.db
				.select()
				.from(authSessions)
				.where(and(eq(authSessions.userId, user.id), gt(authSessions.expiresAt, new Date().toISOString())))
				.limit(1)
				.get();

			if (!session) {
				return null;
			}

			// Update last accessed
			await this.updateSessionAccess(session.id);

			return {
				user: adaptDrizzleUserToLegacy(user),
				session: adaptDrizzleSessionToLegacy(session)
			};
		} catch (error) {
			console.error('Token validation error:', error);
			return null;
		}
	}

	async refreshToken(
		refreshToken: string,
	): Promise<{ accessToken: string; refreshToken: string } | null> {
		const tokenHash = await hashToken(refreshToken);

		const session = await this.db
			.select()
			.from(authSessions)
			.where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, new Date().toISOString())))
			.get();

		if (!session) {
			return null;
		}

		const user = await this.db
			.select()
			.from(users)
			.where(eq(users.id, session.userId))
			.get();

		if (!user) {
			return null;
		}

		// Generate new tokens
		const newAccessToken = await generateJWT(
			{
				sub: user.id,
				email: user.email,
				name: user.name,
				provider: 'github',
			} as JWTPayload,
			this.jwtSecret,
			3600, // 1 hour
		);

		const newRefreshToken = generateRandomId();
		const newTokenHash = await hashToken(newRefreshToken);
		const now = new Date().toISOString();

		// Update session with new refresh token
		await this.db
			.update(authSessions)
			.set({
				tokenHash: newTokenHash,
				lastAccessed: now,
			})
			.where(eq(authSessions.id, session.id));

		// Update KV cache
		const updatedSession = { ...session, token_hash: newTokenHash, last_accessed: now };
		await this.kv.put(`session:${session.id}`, JSON.stringify(updatedSession), {
			expirationTtl: 30 * 24 * 60 * 60, // 30 days
		});

		return { accessToken: newAccessToken, refreshToken: newRefreshToken };
	}

	async invalidateSession(sessionId: string): Promise<void> {
		await this.db.delete(authSessions).where(eq(authSessions.id, sessionId));

		await this.kv.delete(`session:${sessionId}`);
	}

	async invalidateAllUserSessions(userId: string): Promise<void> {
		const sessions = await this.db
			.select({ id: authSessions.id })
			.from(authSessions)
			.where(eq(authSessions.userId, userId))
			.all();

		await this.db.delete(authSessions).where(eq(authSessions.userId, userId));

		// Clean up KV cache
		for (const session of sessions) {
			await this.kv.delete(`session:${session.id}`);
		}
	}

	async cleanupExpiredSessions(): Promise<void> {
		const expiredSessions = await this.db
			.select({ id: authSessions.id })
			.from(authSessions)
			.where(lt(authSessions.expiresAt, new Date().toISOString()))
			.all();

		await this.db.delete(authSessions).where(lt(authSessions.expiresAt, new Date().toISOString()));

		// Clean up KV cache
		for (const session of expiredSessions) {
			await this.kv.delete(`session:${session.id}`);
		}
	}

	private async updateSessionAccess(sessionId: string): Promise<void> {
		const now = new Date().toISOString();
		await this.db
			.update(authSessions)
			.set({ lastAccessed: now })
			.where(eq(authSessions.id, sessionId));
	}
}