import type { AnimeWithMatchInfo } from '@/features/match/types';
import type { MatchFilters, SortValue } from '@/features/match/validation/match-request';

// Pure: narrow + sort the unfiltered server result according to the URL-driven
// filter state. Runs on every filter change in a `useMemo`, so stays synchronous
// and allocation-light.
export function applyFilters(
  rows: AnimeWithMatchInfo[],
  filters: MatchFilters,
  totalUsers: number,
): AnimeWithMatchInfo[] {
  const { mode, includeAiring, genres, formats, yearMin, yearMax, scoreMin, scoreMax } = filters;

  const out = rows.filter((r) => {
    if (mode === 'all' && r.matchCount !== totalUsers) return false;
    // Status allowlist. `includeAiring` only adds shows that are *currently*
    // airing — `NOT_YET_RELEASED` / `CANCELLED` / `HIATUS` are never included,
    // since they're not actually watchable right now.
    if (r.status !== 'FINISHED' && !(includeAiring && r.status === 'RELEASING')) {
      return false;
    }
    if (genres && genres.length > 0) {
      for (const g of genres) if (!r.genres.includes(g)) return false;
    }
    if (formats && formats.length > 0) {
      if (r.format === null) return false;
      if (!(formats as readonly string[]).includes(r.format)) return false;
    }
    if (yearMin !== undefined && (r.seasonYear === null || r.seasonYear < yearMin)) return false;
    if (yearMax !== undefined && (r.seasonYear === null || r.seasonYear > yearMax)) return false;
    if (scoreMin !== undefined && (r.averageScore === null || r.averageScore < scoreMin)) {
      return false;
    }
    if (scoreMax !== undefined && (r.averageScore === null || r.averageScore > scoreMax)) {
      return false;
    }
    return true;
  });

  out.sort(comparatorFor(filters.sort));
  return out;
}

function titleOf(r: AnimeWithMatchInfo): string {
  return r.titleEnglish ?? r.titleRomaji ?? '';
}

// Comparators mirror the DB's ORDER BY branches — nulls always land at the
// end regardless of direction, same tiebreaker order — so client-side results
// match what Phase 1 would have returned.
function comparatorFor(sort: SortValue): (a: AnimeWithMatchInfo, b: AnimeWithMatchInfo) => number {
  const byScoreDesc = numericDesc<AnimeWithMatchInfo>((r) => r.averageScore);
  const byPopDesc = numericDesc<AnimeWithMatchInfo>((r) => r.popularity);
  const byMatchesDesc = (a: AnimeWithMatchInfo, b: AnimeWithMatchInfo) =>
    b.matchCount - a.matchCount;
  const byTitleAsc = (a: AnimeWithMatchInfo, b: AnimeWithMatchInfo) =>
    titleOf(a).localeCompare(titleOf(b));

  switch (sort) {
    case 'score':
      return chain(byScoreDesc, byMatchesDesc, byPopDesc, byTitleAsc);
    case 'popularity':
      return chain(byPopDesc, byMatchesDesc, byScoreDesc, byTitleAsc);
    case 'year-desc':
      return chain(
        numericDesc<AnimeWithMatchInfo>((r) => r.seasonYear),
        byMatchesDesc,
        byTitleAsc,
      );
    case 'year-asc':
      return chain(
        numericAsc<AnimeWithMatchInfo>((r) => r.seasonYear),
        byMatchesDesc,
        byTitleAsc,
      );
    case 'title':
      return chain(byTitleAsc, byMatchesDesc);
    case 'episodes':
      return chain(
        numericAsc<AnimeWithMatchInfo>((r) => r.episodes),
        byMatchesDesc,
        byTitleAsc,
      );
    case 'matches':
    default:
      return chain(byMatchesDesc, byScoreDesc, byPopDesc, byTitleAsc);
  }
}

function chain<T>(...cmps: ((a: T, b: T) => number)[]): (a: T, b: T) => number {
  return (a, b) => {
    for (const c of cmps) {
      const r = c(a, b);
      if (r !== 0) return r;
    }
    return 0;
  };
}

// Returns a comparator that sorts descending by `pick(row)` with nulls always
// at the end — mirrors PG's `DESC NULLS LAST`.
function numericDesc<T>(pick: (t: T) => number | null): (a: T, b: T) => number {
  return (a, b) => {
    const va = pick(a);
    const vb = pick(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va;
  };
}

// Same, ascending — PG's `ASC NULLS LAST`.
function numericAsc<T>(pick: (t: T) => number | null): (a: T, b: T) => number {
  return (a, b) => {
    const va = pick(a);
    const vb = pick(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return va - vb;
  };
}
