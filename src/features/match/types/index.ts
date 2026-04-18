import type { ListProvider } from '@/lib/anilist/errors';
import type { MatchRow } from '@/lib/db/queries/matches';

/**
 * A single user we're matching for. Provider-aware so MAL can drop in later
 * (see `docs/future-multi-provider.md`). Phase 1 callers always pass
 * `provider: 'anilist'`.
 */
export type UserIdentifier = {
  provider: ListProvider;
  username: string;
};

/**
 * The shape a rendered grid card consumes — identical to the DB row for now.
 * Kept as a distinct name so feature code doesn't reach into `lib/db/*` types
 * unnecessarily.
 */
export type AnimeWithMatchInfo = MatchRow;

/**
 * Results grouped by how many users share an anime. "3 of 3 want to watch"
 * is one group; "2 of 3" is another.
 */
export type MatchGroup = {
  /** How many distinct users have this anime in their PLANNING list. */
  matchCount: number;
  /** Number of anime in this group (convenience for the UI header). */
  totalInGroup: number;
  animes: AnimeWithMatchInfo[];
};

export type MatchResult = MatchGroup[];

export type GetMatchesRequest = {
  users: UserIdentifier[];
  /** Restrict to anime with `status = 'FINISHED'`. Defaults to `true`. */
  onlyFinished?: boolean;
};
