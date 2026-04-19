'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { FORMAT_VALUES, type FormatValue } from '@/features/match/validation/match-request';

import { FilterPanel } from './filter-panel';
import { FormatDropdown } from './format-dropdown';
import { SortDropdown } from './sort-dropdown';
import { ViewToggle } from './view-toggle';

type Props = {
  resultCount: number;
  genres: string[];
};

// Reads filter URL params so the "active filter" badge can show the count
// without every subcomponent bubbling state up.
export function FilterBar({ resultCount, genres }: Props) {
  const [values] = useQueryStates({
    genre: parseAsArrayOf(parseAsString).withDefault([]),
    scoreMin: parseAsInteger,
    scoreMax: parseAsInteger,
    yearMin: parseAsInteger,
    yearMax: parseAsInteger,
    includeAiring: parseAsBoolean.withDefault(false),
    format: parseAsArrayOf(parseAsStringLiteral<FormatValue>([...FORMAT_VALUES])).withDefault([]),
  });

  const panelFilterCount =
    values.genre.length +
    (values.scoreMin !== null || values.scoreMax !== null ? 1 : 0) +
    (values.yearMin !== null || values.yearMax !== null ? 1 : 0) +
    (values.includeAiring ? 1 : 0);

  const [inlineOpen, setInlineOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--line-soft)] bg-[var(--bg-0)] px-6 py-3.5 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-baseline gap-2">
          <div className="font-display text-[30px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            {resultCount}
          </div>
          <div className="text-[12.5px] tracking-[0.08em] text-[var(--ink-2)] uppercase">
            matches
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <SortDropdown />
          <FormatDropdown />

          {/* Desktop: inline expand. Mobile (`lg:hidden`): sheet. */}
          <button
            type="button"
            onClick={() => setInlineOpen((v) => !v)}
            aria-expanded={inlineOpen}
            className={cn(
              'hidden items-center gap-2 rounded-[10px] border border-[var(--line-soft)] px-3 py-2 text-[13px] text-[var(--ink-1)] transition-colors lg:inline-flex',
              inlineOpen ? 'bg-[var(--bg-3)]' : 'hover:text-foreground bg-[var(--bg-2)]',
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filters</span>
            {panelFilterCount > 0 && <FilterBadge count={panelFilterCount} />}
          </button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="hover:text-foreground inline-flex items-center gap-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] px-3 py-2 text-[13px] text-[var(--ink-1)] transition-colors lg:hidden"
                />
              }
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Filters</span>
              {panelFilterCount > 0 && <FilterBadge count={panelFilterCount} />}
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow down your matches.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <FilterPanel genres={genres} />
              </div>
            </SheetContent>
          </Sheet>

          <ViewToggle />
        </div>
      </div>

      {inlineOpen && (
        <div className="animate-fadein mt-3.5 hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-1)] p-4 lg:block">
          <FilterPanel genres={genres} />
        </div>
      )}
    </div>
  );
}

function FilterBadge({ count }: { count: number }) {
  return (
    <span className="ml-1 rounded-xl bg-[var(--color-primary)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#1a0f0a]">
      {count}
    </span>
  );
}
