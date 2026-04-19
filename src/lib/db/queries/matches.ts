import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { anime, userPlanningEntries, users } from '@/lib/db/schema';

export type MatchRow = {
  id: number;
  malId: number | null;
  titleRomaji: string | null;
  titleEnglish: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  episodes: number | null;
  format: string | null;
  status: string | null;
  seasonYear: number | null;
  siteUrl: string | null;
  coverMedium: string | null;
  coverLarge: string | null;
  matchCount: number;
  matchedUsers: string[];
};

export type GetMatchesOptions = {
  usernames: string[];
  onlyFinished?: boolean;
};

export async function replaceUserPlanningEntries(
  userId: number,
  animeIds: number[],
): Promise<void> {
  const deleteExisting = db
    .delete(userPlanningEntries)
    .where(eq(userPlanningEntries.userId, userId));

  if (animeIds.length === 0) {
    await deleteExisting;
    return;
  }

  // neon-http has no stateful transactions; `db.batch` wraps the
  // delete+insert in a single server-side transaction.
  await db.batch([
    deleteExisting,
    db.insert(userPlanningEntries).values(animeIds.map((animeId) => ({ userId, animeId }))),
  ]);
}

export async function getMatches(options: GetMatchesOptions): Promise<MatchRow[]> {
  const { usernames, onlyFinished = false } = options;
  if (usernames.length < 2) return [];

  const conditions = [eq(users.provider, 'anilist'), inArray(users.username, usernames)];
  if (onlyFinished) {
    conditions.push(eq(anime.status, 'FINISHED'));
  }

  // Reused in SELECT, HAVING, and ORDER BY — keep as one expression so the
  // query planner sees them as identical.
  const matchCountExpr = sql<number>`COUNT(DISTINCT ${userPlanningEntries.userId})::int`;
  const matchedUsersExpr = sql<
    string[]
  >`ARRAY_AGG(${users.username}::text ORDER BY ${users.username})`;

  const rows = await db
    .select({
      id: anime.id,
      malId: anime.malId,
      titleRomaji: anime.titleRomaji,
      titleEnglish: anime.titleEnglish,
      genres: anime.genres,
      averageScore: anime.averageScore,
      popularity: anime.popularity,
      episodes: anime.episodes,
      format: anime.format,
      status: anime.status,
      seasonYear: anime.seasonYear,
      siteUrl: anime.siteUrl,
      coverMedium: anime.coverMedium,
      coverLarge: anime.coverLarge,
      matchCount: matchCountExpr.as('match_count'),
      matchedUsers: matchedUsersExpr.as('matched_users'),
    })
    .from(userPlanningEntries)
    .innerJoin(users, eq(users.id, userPlanningEntries.userId))
    .innerJoin(anime, eq(anime.id, userPlanningEntries.animeId))
    .where(and(...conditions))
    .groupBy(anime.id)
    .having(sql`${matchCountExpr} >= 2`)
    .orderBy(
      sql`${matchCountExpr} DESC`,
      sql`${anime.averageScore} DESC NULLS LAST`,
      sql`${anime.popularity} DESC NULLS LAST`,
      sql`COALESCE(${anime.titleEnglish}, ${anime.titleRomaji}) ASC`,
    );

  return rows;
}
