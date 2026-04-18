import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Next's runtime, so .env.local is not auto-loaded.
// @next/env mirrors Next's own loader so DATABASE_URL is picked up identically.
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  // db:generate only reads the schema; db:push / db:migrate need a real URL.
  dbCredentials: { url: databaseUrl },
});
