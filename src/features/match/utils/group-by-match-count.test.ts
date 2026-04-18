import { describe, expect, it } from 'vitest';

import type { AnimeWithMatchInfo } from '@/features/match/types';

import { groupByMatchCount } from './group-by-match-count';

const base: Omit<AnimeWithMatchInfo, 'id' | 'matchCount' | 'matchedUsers'> = {
  malId: null,
  titleRomaji: null,
  titleEnglish: null,
  genres: [],
  averageScore: null,
  popularity: null,
  episodes: null,
  format: null,
  status: 'FINISHED',
  seasonYear: null,
  siteUrl: null,
  coverMedium: null,
  coverLarge: null,
};

function row(id: number, matchCount: number, matchedUsers: string[]): AnimeWithMatchInfo {
  return { ...base, id, matchCount, matchedUsers };
}

describe('groupByMatchCount', () => {
  it('returns [] for empty input', () => {
    expect(groupByMatchCount([])).toEqual([]);
  });

  it('buckets anime by matchCount and sorts groups desc', () => {
    const rows = [
      row(1, 3, ['alice', 'bob', 'charlie']),
      row(2, 2, ['alice', 'bob']),
      row(3, 3, ['alice', 'bob', 'charlie']),
      row(4, 2, ['alice', 'charlie']),
    ];

    const groups = groupByMatchCount(rows);

    expect(groups.map((g) => g.matchCount)).toEqual([3, 2]);
    expect(groups[0]?.totalInGroup).toBe(2);
    expect(groups[1]?.totalInGroup).toBe(2);
    expect(groups[0]?.animes.map((a) => a.id)).toEqual([1, 3]);
    expect(groups[1]?.animes.map((a) => a.id)).toEqual([2, 4]);
  });

  it('preserves SQL-provided order within a group', () => {
    // SQL returns highest matchCount, then avg_score desc etc — we should
    // not reshuffle within a group.
    const rows = [row(5, 2, ['a', 'b']), row(6, 2, ['a', 'b']), row(7, 2, ['a', 'b'])];
    const [group] = groupByMatchCount(rows);
    expect(group?.animes.map((a) => a.id)).toEqual([5, 6, 7]);
  });
});
