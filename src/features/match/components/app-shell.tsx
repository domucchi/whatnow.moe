'use client';

import { useMemo } from 'react';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import { applyFilters } from '@/features/match/utils/apply-filters';
import {
  FORMAT_VALUES,
  MODE_VALUES,
  SORT_VALUES,
  VIEW_VALUES,
  type FormatValue,
  type MatchFilters,
  type ModeValue,
  type SortValue,
  type ViewValue,
} from '@/features/match/validation/match-request';
import type { AnimeWithMatchInfo, MatchStats } from '@/features/match/types';

import { FilterBar } from './filter-bar';
import { MatchEmptyState, MatchNoResults } from './match-empty-states';
import { MatchResultsError } from './match-results-error';
import { MatchSidebar } from './match-sidebar';
import { AnimeCard, AnimeRow } from './anime-card';

type Props = {
  initialUsernames: string[];
  allUsernames: string[];
  allMatches: AnimeWithMatchInfo[];
  stats: MatchStats;
  genres: string[];
  started: boolean;
  error: string | null;
};

// Central hub for filter / sort / mode / view URL state. One `useQueryStates`
// call keeps every hook in sync and avoids re-render storms when multiple
// params change together. Writes are shallow (nuqs default) so toggling a
// filter never re-runs the server fetch.
export function AppShell({
  initialUsernames,
  allUsernames,
  allMatches,
  stats,
  genres,
  started,
  error,
}: Props) {
  const [values] = useQueryStates({
    sort: parseAsStringEnum<SortValue>([...SORT_VALUES]).withDefault('matches'),
    mode: parseAsStringEnum<ModeValue>([...MODE_VALUES]).withDefault('any'),
    view: parseAsStringEnum<ViewValue>([...VIEW_VALUES]).withDefault('grid'),
    genre: parseAsArrayOf(parseAsString).withDefault([]),
    format: parseAsArrayOf(parseAsStringLiteral<FormatValue>([...FORMAT_VALUES])).withDefault([]),
    scoreMin: parseAsInteger,
    scoreMax: parseAsInteger,
    yearMin: parseAsInteger,
    yearMax: parseAsInteger,
    includeAiring: parseAsBoolean.withDefault(false),
  });

  const filters: MatchFilters = useMemo(
    () => ({
      sort: values.sort,
      mode: values.mode,
      view: values.view,
      genres: values.genre.length > 0 ? values.genre : undefined,
      formats: values.format.length > 0 ? values.format : undefined,
      yearMin: values.yearMin ?? undefined,
      yearMax: values.yearMax ?? undefined,
      scoreMin: values.scoreMin ?? undefined,
      scoreMax: values.scoreMax ?? undefined,
      includeAiring: values.includeAiring,
    }),
    [
      values.sort,
      values.mode,
      values.view,
      values.genre,
      values.format,
      values.yearMin,
      values.yearMax,
      values.scoreMin,
      values.scoreMax,
      values.includeAiring,
    ],
  );

  const filtered = useMemo(
    () => applyFilters(allMatches, filters, allUsernames.length),
    [allMatches, filters, allUsernames.length],
  );

  return (
    <div className="flex min-h-full w-full flex-col lg:flex-row">
      <MatchSidebar
        initialUsernames={initialUsernames}
        started={started}
        matches={filtered}
        stats={started ? stats : null}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {!started ? (
          <MatchEmptyState />
        ) : error ? (
          <MatchResultsError errorName={error} />
        ) : (
          <>
            <FilterBar resultCount={filtered.length} genres={genres} />
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <MatchNoResults />
              ) : filters.view === 'list' ? (
                <div className="flex flex-col gap-0.5 px-4 py-5 lg:px-6">
                  {filtered.map((anime, i) => (
                    <AnimeRow
                      key={anime.id}
                      anime={anime}
                      rank={i + 1}
                      totalUsers={allUsernames.length}
                      allUsernames={allUsernames}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="grid gap-x-[22px] gap-y-7 px-6 pt-7 pb-10 lg:px-8"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
                >
                  {filtered.map((anime, i) => (
                    <AnimeCard
                      key={anime.id}
                      anime={anime}
                      rank={i + 1}
                      totalUsers={allUsernames.length}
                      allUsernames={allUsernames}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
