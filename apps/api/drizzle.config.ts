import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../../packages/database/src/schema/index.ts',
  out: '../../drizzle/migrations',
  dialect: 'sqlite',
  verbose: true,
  strict: true,
  // Enable breakpoints for safer migrations
  breakpoints: true,
  // Custom migration table for better tracking
  migrations: {
    table: 'drizzle_migrations',
  },
});