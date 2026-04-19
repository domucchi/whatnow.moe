import { getMatches } from '@/features/match/api/get-matches';
import type { AnimeWithMatchInfo, MatchStats, UserIdentifier } from '@/features/match/types';

import { AppShell } from './app-shell';

type Props = {
  users: UserIdentifier[];
  genres: string[];
  initialUsernames: string[];
};

type FetchResult = {
  matches: AnimeWithMatchInfo[];
  stats: MatchStats;
  error: string | null;
};

async function fetchUnfiltered(users: UserIdentifier[]): Promise<FetchResult> {
  try {
    const { matches, stats } = await getMatches({ users });
    return { matches, stats, error: null };
  } catch (err) {
    return {
      matches: [],
      stats: { scanned: 0, perUser: {} },
      error: (err as Error).name,
    };
  }
}

// Thin RSC: fetch the unfiltered match set + stats, then hand off to the
// client `AppShell` which runs all filter/sort/mode logic in-memory.
export async function MatchResults({ users, genres, initialUsernames }: Props) {
  const started = users.length >= 2;
  const { matches, stats, error } = started
    ? await fetchUnfiltered(users)
    : { matches: [] as AnimeWithMatchInfo[], stats: { scanned: 0, perUser: {} }, error: null };

  return (
    <AppShell
      initialUsernames={initialUsernames}
      allUsernames={initialUsernames}
      allMatches={matches}
      stats={stats}
      genres={genres}
      started={started}
      error={error}
    />
  );
}
