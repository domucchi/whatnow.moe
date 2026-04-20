import { describe, expect, it } from 'bun:test';

import type { MatchRow } from '@/lib/db/queries/matches';
import type { MatchFilters } from '@/features/match/validation/match-request';

import { applyFilters } from './apply-filters';

const DEFAULT: MatchFilters = {
  sort: 'matches',
  mode: 'any',
  view: 'grid',
  includeAiring: false,
};

const base: Omit<MatchRow, 'id' | 'titleEnglish' | 'matchCount' | 'matchedUsers'> = {
  malId: null,
  titleRomaji: null,
  genres: [],
  averageScore: null,
  popularity: null,
  episodes: null,
  format: 'TV',
  status: 'FINISHED',
  seasonYear: null,
  siteUrl: null,
  coverMedium: null,
  coverLarge: null,
};

function row(over: Partial<MatchRow> & Pick<MatchRow, 'id'>): MatchRow {
  return {
    ...base,
    titleEnglish: `Anime ${over.id}`,
    matchCount: 2,
    matchedUsers: ['alice', 'bob'],
    ...over,
  };
}

describe('applyFilters', () => {
  it('drops currently airing rows by default', () => {
    const rows = [row({ id: 1, status: 'RELEASING' }), row({ id: 2, status: 'FINISHED' })];
    expect(applyFilters(rows, DEFAULT, 2).map((r) => r.id)).toEqual([2]);
  });

  it('includes RELEASING rows when includeAiring is true', () => {
    const rows = [row({ id: 1, status: 'RELEASING' }), row({ id: 2, status: 'FINISHED' })];
    expect(applyFilters(rows, { ...DEFAULT, includeAiring: true }, 2).map((r) => r.id)).toEqual([
      1, 2,
    ]);
  });

  it('always hides upcoming / cancelled / hiatus shows, even with includeAiring', () => {
    const rows = [
      row({ id: 1, status: 'FINISHED' }),
      row({ id: 2, status: 'RELEASING' }),
      row({ id: 3, status: 'NOT_YET_RELEASED' }),
      row({ id: 4, status: 'CANCELLED' }),
      row({ id: 5, status: 'HIATUS' }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, includeAiring: true }, 2).map((r) => r.id)).toEqual([
      1, 2,
    ]);
    expect(applyFilters(rows, DEFAULT, 2).map((r) => r.id)).toEqual([1]);
  });

  it('mode=all keeps only unanimous rows', () => {
    const rows = [
      row({ id: 1, matchCount: 3 }),
      row({ id: 2, matchCount: 2 }),
      row({ id: 3, matchCount: 3 }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, mode: 'all' }, 3).map((r) => r.id)).toEqual([1, 3]);
  });

  it('genres filter requires all selected genres to be present', () => {
    const rows = [
      row({ id: 1, genres: ['Action'] }),
      row({ id: 2, genres: ['Action', 'Mecha'] }),
      row({ id: 3, genres: ['Mecha', 'Drama'] }),
    ];
    expect(
      applyFilters(rows, { ...DEFAULT, genres: ['Action', 'Mecha'] }, 2).map((r) => r.id),
    ).toEqual([2]);
  });

  it('formats filter matches any of the selected formats', () => {
    const rows = [
      row({ id: 1, format: 'TV' }),
      row({ id: 2, format: 'MOVIE' }),
      row({ id: 3, format: 'OVA' }),
    ];
    expect(
      applyFilters(rows, { ...DEFAULT, formats: ['TV', 'MOVIE'] }, 2).map((r) => r.id),
    ).toEqual([1, 2]);
  });

  it('year-range filter is inclusive on both ends', () => {
    const rows = [
      row({ id: 1, seasonYear: 2000 }),
      row({ id: 2, seasonYear: 2010 }),
      row({ id: 3, seasonYear: 2020 }),
      row({ id: 4, seasonYear: null }),
    ];
    expect(
      applyFilters(rows, { ...DEFAULT, yearMin: 2005, yearMax: 2015 }, 2).map((r) => r.id),
    ).toEqual([2]);
  });

  it('scoreMin drops rows below the threshold (and those with null score)', () => {
    const rows = [
      row({ id: 1, averageScore: 80 }),
      row({ id: 2, averageScore: 60 }),
      row({ id: 3, averageScore: null }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, scoreMin: 75 }, 2).map((r) => r.id)).toEqual([1]);
  });

  it('scoreMax drops rows above the threshold (and those with null score)', () => {
    const rows = [
      row({ id: 1, averageScore: 80 }),
      row({ id: 2, averageScore: 60 }),
      row({ id: 3, averageScore: null }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, scoreMax: 70 }, 2).map((r) => r.id)).toEqual([2]);
  });

  it('score range filters inclusively on both ends', () => {
    const rows = [
      row({ id: 1, averageScore: 50 }),
      row({ id: 2, averageScore: 70 }),
      row({ id: 3, averageScore: 85 }),
      row({ id: 4, averageScore: 95 }),
    ];
    // Default sort is `matches` which tiebreaks on averageScore DESC, so
    // id=3 (85%) outranks id=2 (70%) despite input order.
    expect(
      applyFilters(rows, { ...DEFAULT, scoreMin: 70, scoreMax: 85 }, 2).map((r) => r.id),
    ).toEqual([3, 2]);
  });

  it('sort=score orders by averageScore desc (nulls last)', () => {
    const rows = [
      row({ id: 1, averageScore: 70 }),
      row({ id: 2, averageScore: 90 }),
      row({ id: 3, averageScore: null }),
      row({ id: 4, averageScore: 80 }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, sort: 'score' }, 2).map((r) => r.id)).toEqual([
      2, 4, 1, 3,
    ]);
  });

  it('sort=year-desc orders by seasonYear desc (nulls last)', () => {
    const rows = [
      row({ id: 1, seasonYear: 2001 }),
      row({ id: 2, seasonYear: 2020 }),
      row({ id: 3, seasonYear: null }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, sort: 'year-desc' }, 2).map((r) => r.id)).toEqual([
      2, 1, 3,
    ]);
  });

  it('sort=title orders by the best-available title ascending', () => {
    const rows = [
      row({ id: 1, titleEnglish: 'Zeta Gundam' }),
      row({ id: 2, titleEnglish: 'Akira' }),
      row({ id: 3, titleEnglish: null, titleRomaji: 'Monster' }),
    ];
    expect(applyFilters(rows, { ...DEFAULT, sort: 'title' }, 2).map((r) => r.id)).toEqual([
      2, 3, 1,
    ]);
  });

  it('default sort=matches puts higher match-count rows first', () => {
    const rows = [
      row({ id: 1, matchCount: 2, averageScore: 90 }),
      row({ id: 2, matchCount: 3, averageScore: 70 }),
    ];
    expect(applyFilters(rows, DEFAULT, 3).map((r) => r.id)).toEqual([2, 1]);
  });
});
