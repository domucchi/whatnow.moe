'use client';

import { ArrowDownUp, ChevronDown } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SORT_VALUES, type SortValue } from '@/features/match/validation/match-request';

const LABELS: Record<SortValue, string> = {
  matches: 'Most matches',
  score: 'Highest scored',
  popularity: 'Most popular',
  'year-desc': 'Newest first',
  'year-asc': 'Oldest first',
  title: 'Title A → Z',
  episodes: 'Shortest first',
};

export function SortDropdown() {
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringEnum<SortValue>([...SORT_VALUES])
      .withDefault('matches')
      .withOptions({
        clearOnDefault: true,
        history: 'replace',
      }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:text-foreground inline-flex items-center gap-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] px-3 py-2 text-[13px] text-[var(--ink-1)] transition-colors outline-none aria-expanded:bg-[var(--bg-3)]">
        <ArrowDownUp className="size-3.5" />
        <span>{LABELS[sort]}</span>
        <ChevronDown className="size-3.5 text-[var(--ink-3)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(v) =>
            void setSort((v as SortValue) === 'matches' ? null : (v as SortValue))
          }
        >
          {SORT_VALUES.map((v) => (
            <DropdownMenuRadioItem key={v} value={v}>
              {LABELS[v]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
