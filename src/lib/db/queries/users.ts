import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import type { ListProvider } from '@/lib/anilist/errors';

export type UserMeta = {
  id: number;
  lastFetchedAt: Date | null;
  notFound: boolean;
};

// On conflict we always clear `not_found` — a user who exists now must not
// keep a stale 404 cache from a previous lookup.
export async function upsertUser(
  provider: ListProvider,
  username: string,
  externalId?: number,
): Promise<number> {
  const rows = await db
    .insert(users)
    .values({
      provider,
      username,
      externalId: externalId ?? null,
      lastFetchedAt: new Date(),
      notFound: false,
    })
    .onConflictDoUpdate({
      target: [users.provider, users.username],
      set: {
        externalId: externalId ?? sql`${users.externalId}`,
        lastFetchedAt: new Date(),
        notFound: false,
      },
    })
    .returning({ id: users.id });

  const row = rows[0];
  if (!row) {
    throw new Error('upsertUser: no row returned after insert');
  }
  return row.id;
}

export async function markUserNotFound(provider: ListProvider, username: string): Promise<void> {
  await db
    .insert(users)
    .values({
      provider,
      username,
      lastFetchedAt: new Date(),
      notFound: true,
    })
    .onConflictDoUpdate({
      target: [users.provider, users.username],
      set: {
        lastFetchedAt: new Date(),
        notFound: true,
      },
    });
}

export async function getUserMeta(
  provider: ListProvider,
  username: string,
): Promise<UserMeta | null> {
  const rows = await db
    .select({
      id: users.id,
      lastFetchedAt: users.lastFetchedAt,
      notFound: users.notFound,
    })
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.username, username)))
    .limit(1);

  return rows[0] ?? null;
}
