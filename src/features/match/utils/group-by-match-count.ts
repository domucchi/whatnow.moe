import type { AnimeWithMatchInfo, MatchGroup } from '@/features/match/types';

// Rows arrive already sorted within each match-count group (see `getMatches`),
// so this only buckets by count and orders the buckets — no inner re-sort.
export function groupByMatchCount(rows: AnimeWithMatchInfo[]): MatchGroup[] {
  const byCount = new Map<number, AnimeWithMatchInfo[]>();

  for (const row of rows) {
    const bucket = byCount.get(row.matchCount);
    if (bucket) {
      bucket.push(row);
    } else {
      byCount.set(row.matchCount, [row]);
    }
  }

  return Array.from(byCount.entries())
    .sort(([a], [b]) => b - a)
    .map(([matchCount, animes]) => ({
      matchCount,
      totalInGroup: animes.length,
      animes,
    }));
}
