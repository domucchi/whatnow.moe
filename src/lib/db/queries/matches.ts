import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';

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

export type SortKey =
  | 'matches'
  | 'score'
  | 'popularity'
  | 'year-desc'
  | 'year-asc'
  | 'title'
  | 'episodes';

export type MatchMode = 'any' | 'all';

export type GetMatchesOptions = {
  usernames: string[];
  includeAiring?: boolean;
  genres?: string[];
  formats?: string[];
  yearMin?: number;
  yearMax?: number;
  minScore?: number;
  sort?: SortKey;
  mode?: MatchMode;
};

export type GetMatchesStats = {
  scanned: number;
  perUser: Record<string, number>;
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
  const {
    usernames,
    includeAiring = false,
    genres,
    formats,
    yearMin,
    yearMax,
    minScore,
    sort = 'matches',
    mode = 'any',
  } = options;
  if (usernames.length < 2) return [];

  const conditions: SQL[] = [eq(users.provider, 'anilist'), inArray(users.username, usernames)];
  if (!includeAiring) {
    conditions.push(eq(anime.status, 'FINISHED'));
  }
  if (genres && genres.length > 0) {
    // Postgres array-contains: anime.genres ⊇ genres[]. `@>` is the only idiom
    // that uses the GIN index on `genres`; `= ANY` would force a seq-scan.
    conditions.push(sql`${anime.genres} @> ${genres}::text[]`);
  }
  if (formats && formats.length > 0) {
    conditions.push(inArray(anime.format, formats));
  }
  if (yearMin !== undefined) {
    conditions.push(sql`${anime.seasonYear} >= ${yearMin}`);
  }
  if (yearMax !== undefined) {
    conditions.push(sql`${anime.seasonYear} <= ${yearMax}`);
  }
  if (minScore !== undefined && minScore > 0) {
    conditions.push(sql`${anime.averageScore} >= ${minScore}`);
  }

  // Reused in SELECT, HAVING, and ORDER BY — keep as one expression so the
  // query planner sees them as identical.
  const matchCountExpr = sql<number>`COUNT(DISTINCT ${userPlanningEntries.userId})::int`;
  const matchedUsersExpr = sql<
    string[]
  >`ARRAY_AGG(${users.username}::text ORDER BY ${users.username})`;

  // HAVING branches on mode — `all` means every listed user must have the
  // anime; `any` keeps the Phase 1 behavior of "at least 2 overlap".
  const havingExpr =
    mode === 'all' ? sql`${matchCountExpr} = ${usernames.length}` : sql`${matchCountExpr} >= 2`;

  const titleExpr = sql`COALESCE(${anime.titleEnglish}, ${anime.titleRomaji})`;

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
    .having(havingExpr)
    .orderBy(...orderByFor(sort, matchCountExpr, titleExpr));

  return rows;
}

function orderByFor(sort: SortKey, matchCountExpr: SQL<number>, titleExpr: SQL<unknown>): SQL[] {
  const titleAsc = sql`${titleExpr} ASC`;
  switch (sort) {
    case 'score':
      return [
        sql`${anime.averageScore} DESC NULLS LAST`,
        sql`${matchCountExpr} DESC`,
        sql`${anime.popularity} DESC NULLS LAST`,
        titleAsc,
      ];
    case 'popularity':
      return [
        sql`${anime.popularity} DESC NULLS LAST`,
        sql`${matchCountExpr} DESC`,
        sql`${anime.averageScore} DESC NULLS LAST`,
        titleAsc,
      ];
    case 'year-desc':
      return [sql`${anime.seasonYear} DESC NULLS LAST`, sql`${matchCountExpr} DESC`, titleAsc];
    case 'year-asc':
      return [sql`${anime.seasonYear} ASC NULLS LAST`, sql`${matchCountExpr} DESC`, titleAsc];
    case 'title':
      return [titleAsc, sql`${matchCountExpr} DESC`];
    case 'episodes':
      return [sql`${anime.episodes} ASC NULLS LAST`, sql`${matchCountExpr} DESC`, titleAsc];
    case 'matches':
    default:
      // Default: match count first (the "overlap density" the app is built
      // around), then score / popularity / title as tiebreakers.
      return [
        sql`${matchCountExpr} DESC`,
        sql`${anime.averageScore} DESC NULLS LAST`,
        sql`${anime.popularity} DESC NULLS LAST`,
        titleAsc,
      ];
  }
}

// Universe size + per-user totals — used for the sidebar stats. These run on
// the raw planning lists (no format/year/etc filters) because "scanned" and
// "per user" are meant to describe the source data the match was computed
// from, not the filtered view.
export async function getMatchStats(usernames: string[]): Promise<GetMatchesStats> {
  if (usernames.length === 0) {
    return { scanned: 0, perUser: {} };
  }

  const whereClause = and(eq(users.provider, 'anilist'), inArray(users.username, usernames));

  const [scannedRows, perUserRows] = await Promise.all([
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${userPlanningEntries.animeId})::int`,
      })
      .from(userPlanningEntries)
      .innerJoin(users, eq(users.id, userPlanningEntries.userId))
      .where(whereClause),
    db
      .select({
        username: sql<string>`${users.username}::text`,
        count: sql<number>`COUNT(DISTINCT ${userPlanningEntries.animeId})::int`,
      })
      .from(userPlanningEntries)
      .innerJoin(users, eq(users.id, userPlanningEntries.userId))
      .where(whereClause)
      .groupBy(users.username),
  ]);

  const scanned = scannedRows[0]?.count ?? 0;
  const perUser: Record<string, number> = {};
  for (const row of perUserRows) perUser[row.username] = row.count;
  // Fill in zero for users who had no entries (or were not found).
  for (const u of usernames) if (!(u in perUser)) perUser[u] = 0;

  return { scanned, perUser };
}
