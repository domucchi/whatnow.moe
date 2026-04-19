import { ensureUserListCached } from '@/lib/cache/list-cache';
import { getMatches as getMatchesFromDb } from '@/lib/db/queries/matches';
import { groupByMatchCount } from '@/features/match/utils/group-by-match-count';
import type { GetMatchesRequest, MatchResult } from '@/features/match/types';

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
