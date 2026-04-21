import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Next's runtime, so .env.local is not auto-loaded.
// @next/env mirrors Next's own loader so DATABASE_URL is picked up identically.
loadEnvConfig(process.cwd());

const target = process.env.MIGRATE_TARGET ?? 'development';
const envVar = target === 'production' ? 'DATABASE_URL_PROD' : 'DATABASE_URL';
const databaseUrl = process.env[envVar] ?? '';

if (target === 'production' && !databaseUrl) {
  throw new Error(`MIGRATE_TARGET=production requires ${envVar} to be set in .env.local.`);
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  // db:generate only reads the schema; db:migrate needs a real URL.
  dbCredentials: { url: databaseUrl },
});
