import { ensureUserListCached } from '@/lib/cache/list-cache';
import { getMatches as getMatchesFromDb, getMatchStats } from '@/lib/db/queries/matches';
import type { GetMatchesRequest, MatchResult } from '@/features/match/types';

// Single server-side fetch per user-set. Filters / sort / mode are all applied
// client-side from this unfiltered result, so toggling a filter never triggers
// another DB round-trip.
export async function getMatches(request: GetMatchesRequest): Promise<MatchResult> {
  const { users } = request;

  if (users.length < 2) {
    return { matches: [], stats: { scanned: 0, perUser: {} } };
  }

  await Promise.all(users.map((user) => ensureUserListCached(user.provider, user.username)));

  const anilistUsernames = users.filter((u) => u.provider === 'anilist').map((u) => u.username);

  const [rows, stats] = await Promise.all([
    getMatchesFromDb({
      usernames: anilistUsernames,
      // Broadest query: every overlap ≥ 2, all statuses. Client narrows.
      mode: 'any',
      includeAiring: true,
      sort: 'matches',
    }),
    getMatchStats(anilistUsernames),
  ]);

  return { matches: rows, stats };
}
