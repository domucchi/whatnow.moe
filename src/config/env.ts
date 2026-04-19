import { z } from 'zod';

// Direct `process.env` reads are blocked by ESLint (see `no-restricted-syntax`
// in `eslint.config.mjs`); this file is the only exempt module.
const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres connection string'),
  ANILIST_USER_AGENT: z
    .string()
    .min(1, 'ANILIST_USER_AGENT must be set (e.g. "whatnow.moe (https://github.com/…)")'),
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
