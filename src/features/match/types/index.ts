import type { ListProvider } from '@/lib/anilist/errors';
import type { MatchRow } from '@/lib/db/queries/matches';

export type UserIdentifier = {
  provider: ListProvider;
  username: string;
};

export type AnimeWithMatchInfo = MatchRow;

export type MatchStats = {
  // `scanned` is the size of the union of planning lists — useful as a
  // denominator for "N out of all you're all planning" context.
  scanned: number;
  // Per-username count of planning-list entries (pre-filter).
  perUser: Record<string, number>;
};

export type MatchResult = {
  matches: AnimeWithMatchInfo[];
  stats: MatchStats;
};

export type GetMatchesRequest = {
  users: UserIdentifier[];
};
