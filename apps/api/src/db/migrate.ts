// Database migration script for Second Brain App

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
}

// SQL schema embedded directly since we can't use fs in Cloudflare Workers
const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);
`;

export async function runMigrations(db: D1Database): Promise<MigrationResult> {
  try {
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await db.prepare(statement).run();
      }
    }

    return {
      success: true,
      message: `Successfully executed ${statements.length} migration statements`,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: 'Database migration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkTables(db: D1Database): Promise<string[]> {
  try {
    const result = await db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
      )
      .all();

    return result.results.map((row: any) => row.name);
  } catch (error) {
    console.error('Failed to check tables:', error);
    return [];
  }
}

export async function seedTestData(db: D1Database): Promise<MigrationResult> {
  try {
    // Check if we already have test data
    const existingUsers = await db
      .prepare('SELECT COUNT(*) as count FROM users')
      .first();

    if (existingUsers && (existingUsers as any).count > 0) {
      return {
        success: true,
        message: 'Test data already exists',
      };
    }

    // Insert test user (for development only)
    const testUserId = 'test-user-' + Date.now();
    const now = new Date().toISOString();

    await db
      .prepare(
        `
      INSERT INTO users (id, github_id, email, name, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        testUserId,
        123456789,
        'test@example.com',
        'Test User',
        'https://github.com/images/error/octocat_happy.gif',
        now,
        now
      )
      .run();

    await db
      .prepare(
        `
      INSERT INTO oauth_providers (id, user_id, provider, provider_user_id, provider_email, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        'test-provider-' + Date.now(),
        testUserId,
        'github',
        '123456789',
        'test@example.com',
        now
      )
      .run();

    return {
      success: true,
      message: 'Test data seeded successfully',
    };
  } catch (error) {
    console.error('Failed to seed test data:', error);
    return {
      success: false,
      message: 'Failed to seed test data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
