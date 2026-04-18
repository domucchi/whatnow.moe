import type { AnimeWithMatchInfo, MatchGroup } from '@/features/match/types';

/**
 * Collapse flat match rows into sections keyed by `matchCount`, ordered from
 * most-matched to least. The SQL already returns rows sorted within each
 * count, so we only need to bucket — not re-sort inside a group.
 */
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
