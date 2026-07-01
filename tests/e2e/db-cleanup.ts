import { and, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { loadEnvConfig } from '@next/env';

import * as schema from '../../src/lib/db/schema';
import { anime, users } from '../../src/lib/db/schema';
import { E2E_MEDIA_IDS } from '../../src/testing/mocks/anilist-handlers';

let loaded = false;

export async function resetFixtureUsers(usernames: string[]) {
  if (!loaded) {
    loadEnvConfig(process.cwd());
    loaded = true;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for e2e cleanup.');

  const db = drizzle({ client: neon(databaseUrl), schema, casing: 'snake_case' });

  await db
    .delete(users)
    .where(and(eq(users.provider, 'anilist'), inArray(users.username, usernames)));
  await db.delete(anime).where(inArray(anime.id, Object.values(E2E_MEDIA_IDS)));
}
