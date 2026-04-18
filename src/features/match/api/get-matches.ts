import { ensureUserListCached } from '@/lib/cache/list-cache';
import { getMatches as getMatchesFromDb } from '@/lib/db/queries/matches';
import { groupByMatchCount } from '@/features/match/utils/group-by-match-count';
import type { GetMatchesRequest, MatchResult } from '@/features/match/types';

/**
 * Orchestrator called by the `/match/[...usernames]` RSC page.
 *
 * Responsibilities:
 * 1. Ensure every requested user's PLANNING list is cached in our DB
 *    (parallel fetches; typed errors bubble — `UserNotFoundError` etc.).
 * 2. Run the matching SQL against the cached rows.
 * 3. Group results by how many users share each anime.
 *
 * Phase 1 only supports `provider: 'anilist'`. The `users` array is still
 * `UserIdentifier[]` so the call site doesn't need to change when MAL lands.
 */
export async function getMatches(request: GetMatchesRequest): Promise<MatchResult> {
  const { users, onlyFinished = true } = request;

  if (users.length < 2) return [];

  await Promise.all(users.map((user) => ensureUserListCached(user.provider, user.username)));

  const anilistUsernames = users.filter((u) => u.provider === 'anilist').map((u) => u.username);

  const rows = await getMatchesFromDb({
    usernames: anilistUsernames,
    onlyFinished,
  });

  return groupByMatchCount(rows);
}
