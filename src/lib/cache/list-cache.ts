import { fetchPlanningList } from '@/lib/anilist/client';
import { UserNotFoundError, type ListProvider } from '@/lib/anilist/errors';
import type { AnilistMedia } from '@/lib/anilist/schemas';
import { upsertAnimeBatch, type NewAnimeRow } from '@/lib/db/queries/anime';
import { replaceUserPlanningEntries } from '@/lib/db/queries/matches';
import { getUserMeta, markUserNotFound, upsertUser } from '@/lib/db/queries/users';

const FRESH_TTL_MS = 60 * 60 * 1000;
// Short enough that typos stop hurting once the user fixes them.
const NOT_FOUND_TTL_MS = 5 * 60 * 1000;

// SWR (background refresh between 1h and 24h) is deliberately deferred:
// Next's `after()` isn't always safe outside a request context (notably tests),
// and the fresh TTL already caps AniList traffic at ~1 call/user/hour.
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

async function refreshUserList(provider: ListProvider, username: string): Promise<void> {
  const response = await fetchPlanningList(username);

  if (response.data.MediaListCollection === null) {
    await markUserNotFound(provider, username);
    throw new UserNotFoundError(provider, username);
  }

  const media = response.data.MediaListCollection.lists.flatMap((list) =>
    list.entries.map((entry) => entry.media),
  );

  // AniList can return the same anime under multiple lists (custom lists),
  // so dedupe by id before upserting.
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
