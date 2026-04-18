import { fetchPlanningList } from '@/lib/anilist/client';
import { UserNotFoundError, type ListProvider } from '@/lib/anilist/errors';
import type { AnilistMedia } from '@/lib/anilist/schemas';
import { upsertAnimeBatch, type NewAnimeRow } from '@/lib/db/queries/anime';
import { replaceUserPlanningEntries } from '@/lib/db/queries/matches';
import { getUserMeta, markUserNotFound, upsertUser } from '@/lib/db/queries/users';

/**
 * How long a successful fetch counts as "fresh". While fresh the DB is
 * served without touching AniList.
 */
const FRESH_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * How long a 404 (username doesn't exist) is cached before we try AniList
 * again. Short enough that typos don't ruin someone's day once they fix them.
 */
const NOT_FOUND_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Guarantees `username` has an up-to-date PLANNING list in the DB. On return,
 * the caller can safely query `user_planning_entries`. Throws
 * `UserNotFoundError` when AniList reports the user does not exist.
 *
 * Cache rules:
 * - `not_found` newer than 5 min → throw without hitting AniList.
 * - `last_fetched_at` within 1 h → fresh, return immediately.
 * - Otherwise → fetch synchronously, upsert anime, replace the entries.
 *
 * Stale-while-revalidate (background refresh for 1h–24h old caches) is
 * deliberately deferred — Next's `after()` isn't always safe to call outside
 * a request context (notably tests), and the fresh TTL already bounds
 * AniList traffic to ~1 call/user/hour in the worst case.
 */
export async function ensureUserListCached(
  provider: ListProvider,
  username: string,
): Promise<void> {
  const meta = await getUserMeta(provider, username);
  const now = Date.now();

  if (meta?.notFound && meta.lastFetchedAt) {
    if (now - meta.lastFetchedAt.getTime() < NOT_FOUND_TTL_MS) {
      throw new UserNotFoundError(provider, username);
    }
  }

  if (meta && !meta.notFound && meta.lastFetchedAt) {
    if (now - meta.lastFetchedAt.getTime() < FRESH_TTL_MS) {
      return;
    }
  }

  await refreshUserList(provider, username);
}

/**
 * Hard refresh: fetch from AniList, upsert anime + user, replace the
 * planning entries for this user. Propagates `UserNotFoundError` when
 * AniList returns `MediaListCollection: null`.
 */
async function refreshUserList(provider: ListProvider, username: string): Promise<void> {
  const response = await fetchPlanningList(username);

  if (response.data.MediaListCollection === null) {
    await markUserNotFound(provider, username);
    throw new UserNotFoundError(provider, username);
  }

  const media = response.data.MediaListCollection.lists.flatMap((list) =>
    list.entries.map((entry) => entry.media),
  );

  // Dedupe by id — AniList sometimes splits lists (e.g. custom lists) which
  // can yield the same anime twice.
  const uniqueById = new Map<number, AnilistMedia>();
  for (const m of media) uniqueById.set(m.id, m);
  const uniqueMedia = Array.from(uniqueById.values());

  const animeRows: NewAnimeRow[] = uniqueMedia.map((m) => ({
    id: m.id,
    malId: m.idMal,
    titleRomaji: m.title.romaji,
    titleEnglish: m.title.english,
    genres: m.genres,
    averageScore: m.averageScore,
    popularity: m.popularity,
    episodes: m.episodes,
    format: m.format,
    status: m.status,
    seasonYear: m.seasonYear,
    siteUrl: m.siteUrl,
    coverMedium: m.coverImage.medium,
    coverLarge: m.coverImage.large,
  }));

  await upsertAnimeBatch(animeRows);
  const userId = await upsertUser(provider, username);
  await replaceUserPlanningEntries(
    userId,
    uniqueMedia.map((m) => m.id),
  );
}
