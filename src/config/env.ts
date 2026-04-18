import { z } from 'zod';

/**
 * Single source of truth for server-side environment variables.
 *
 * Every module that needs configuration must import `env` from here instead of
 * reading `process.env` directly — ESLint enforces this (see `no-restricted-syntax`
 * in `eslint.config.mjs`). This file is the only one exempt.
 *
 * Validation runs once at module load. Invalid or missing vars throw immediately,
 * which means a misconfigured deploy fails fast at boot instead of at the first
 * request that happens to touch the bad var.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres connection string'),
  ANILIST_USER_AGENT: z
    .string()
    .min(1, 'ANILIST_USER_AGENT must be set (e.g. "anilist-match (https://github.com/…)")'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '\u274c Invalid environment variables:\n',
    JSON.stringify(z.treeifyError(parsed.error), null, 2),
  );
  throw new Error('Invalid environment variables. See logs above.');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
