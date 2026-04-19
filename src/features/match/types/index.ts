import type { ListProvider } from '@/lib/anilist/errors';
import type { MatchRow } from '@/lib/db/queries/matches';

export type UserIdentifier = {
  provider: ListProvider;
  username: string;
};

export type AnimeWithMatchInfo = MatchRow;

export type MatchGroup = {
  matchCount: number;
  totalInGroup: number;
  animes: AnimeWithMatchInfo[];
};

export type MatchResult = MatchGroup[];

export type GetMatchesRequest = {
  users: UserIdentifier[];
  onlyFinished?: boolean;
};
