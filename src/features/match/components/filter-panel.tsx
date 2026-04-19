'use client';

import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { RefreshCw } from 'lucide-react';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  SCORE_MAX,
  SCORE_MIN,
  YEAR_MAX,
  YEAR_MIN,
} from '@/features/match/validation/match-request';

type Props = {
  genres: string[];
};

export function FilterPanel({ genres }: Props) {
  const [selectedGenres, setSelectedGenres] = useQueryState(
    'genre',
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({
      clearOnDefault: true,
      history: 'replace',
    }),
  );
  const [scoreMin, setScoreMin] = useQueryState(
    'scoreMin',
    parseAsInteger.withOptions({
      clearOnDefault: true,
      history: 'replace',
    }),
  );
  const [scoreMax, setScoreMax] = useQueryState(
    'scoreMax',
    parseAsInteger.withOptions({
      clearOnDefault: true,
      history: 'replace',
    }),
  );
  const [yearMin, setYearMin] = useQueryState(
    'yearMin',
    parseAsInteger.withOptions({
      clearOnDefault: true,
      history: 'replace',
    }),
  );
  const [yearMax, setYearMax] = useQueryState(
    'yearMax',
    parseAsInteger.withOptions({
      clearOnDefault: true,
      history: 'replace',
    }),
  );
  const [includeAiring, setIncludeAiring] = useQueryState(
    'includeAiring',
    parseAsBoolean.withDefault(false).withOptions({
      clearOnDefault: true,
      history: 'replace',
    }),
  );

  const yMin = yearMin ?? YEAR_MIN;
  const yMax = yearMax ?? YEAR_MAX;
  const sMin = scoreMin ?? SCORE_MIN;
  const sMax = scoreMax ?? SCORE_MAX;
  const hasFilters =
    selectedGenres.length > 0 ||
    includeAiring ||
    yearMin !== null ||
    yearMax !== null ||
    scoreMin !== null ||
    scoreMax !== null;

  const toggleGenre = (g: string) => {
    const next = selectedGenres.includes(g)
      ? selectedGenres.filter((x) => x !== g)
      : [...selectedGenres, g];
    void setSelectedGenres(next.length === 0 ? null : next);
  };

  const resetAll = () => {
    void setSelectedGenres(null);
    void setScoreMin(null);
    void setScoreMax(null);
    void setYearMin(null);
    void setYearMax(null);
    void setIncludeAiring(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">Score</div>
          <div className="text-xs text-[var(--ink-1)] tabular-nums">
            {sMin}% – {sMax}%
          </div>
        </div>
        <Slider
          value={[sMin, sMax]}
          min={SCORE_MIN}
          max={SCORE_MAX}
          step={5}
          onValueChange={(vals) => {
            const arr = vals as [number, number];
            void setScoreMin(arr[0] === SCORE_MIN ? null : arr[0]);
            void setScoreMax(arr[1] === SCORE_MAX ? null : arr[1]);
          }}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">Year</div>
          <div className="text-xs text-[var(--ink-1)] tabular-nums">
            {yMin} – {yMax}
          </div>
        </div>
        <Slider
          value={[yMin, yMax]}
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          onValueChange={(vals) => {
            const arr = vals as [number, number];
            void setYearMin(arr[0] === YEAR_MIN ? null : arr[0]);
            void setYearMax(arr[1] === YEAR_MAX ? null : arr[1]);
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] px-3 py-2.5">
        <div>
          <div className="text-foreground text-[12.5px] font-medium">Include currently airing</div>
          <div className="text-[11px] text-[var(--ink-3)]">
            Adds shows airing right now. Upcoming and cancelled shows are always hidden.
          </div>
        </div>
        <Switch
          checked={includeAiring}
          onCheckedChange={(v) => void setIncludeAiring(v ? true : null)}
        />
      </div>

      <div>
        <div className="mb-2 text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">
          Genres ·{' '}
          <span className="text-[var(--ink-1)]">
            {selectedGenres.length ? selectedGenres.join(' + ') : 'any'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {genres.map((g) => {
            const active = selectedGenres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={cn(
                  'rounded-full border px-2.5 py-[5px] text-xs transition-colors',
                  active
                    ? 'border-[var(--ink-0)] bg-[var(--ink-0)] text-[#1a1512]'
                    : 'hover:text-foreground border-[var(--line-soft)] bg-[var(--bg-2)] text-[var(--ink-2)]',
                )}
              >
                {g}
              </button>
            );
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="border-primary/30 inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-[5px] text-xs text-[var(--accent-soft)]"
            >
              <RefreshCw className="size-3" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
