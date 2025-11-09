import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../../packages/database/src/schema/index.ts',
  out: '../../drizzle/migrations',
  dialect: 'sqlite',
  verbose: true,
  strict: true,
});