import type { MatchGroup } from '@/features/match/types';

import { AnimeCard } from './anime-card';

type Props = {
  group: MatchGroup;
  totalUsers: number;
};

/**
 * One "N of M want to watch" section with its anime grid. RSC — all static.
 */
export function MatchSection({ group, totalUsers }: Props) {
  const header =
    group.matchCount === totalUsers
      ? `All ${totalUsers} want to watch`
      : `${group.matchCount} of ${totalUsers} want to watch`;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        {header} <span className="text-muted-foreground font-normal">· {group.totalInGroup}</span>
      </h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {group.animes.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </section>
  );
}
