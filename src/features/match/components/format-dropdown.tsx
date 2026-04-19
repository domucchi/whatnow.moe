'use client';

import { ChevronDown, Tv } from 'lucide-react';
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from 'nuqs';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FORMAT_VALUES, type FormatValue } from '@/features/match/validation/match-request';

const LABELS: Record<FormatValue, string> = {
  TV: 'TV series',
  TV_SHORT: 'TV short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music video',
};

export function FormatDropdown() {
  const [selected, setSelected] = useQueryState(
    'format',
    parseAsArrayOf(parseAsStringLiteral<FormatValue>([...FORMAT_VALUES]))
      .withDefault([])
      .withOptions({
        clearOnDefault: true,
        history: 'replace',
      }),
  );

  const toggle = (v: FormatValue) => {
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    void setSelected(next.length === 0 ? null : next);
  };

  const label =
    selected.length === 0
      ? 'All formats'
      : selected.length === 1
        ? (LABELS[selected[0]!] ?? selected[0]!)
        : `${selected.length} formats`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:text-foreground inline-flex items-center gap-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] px-3 py-2 text-[13px] text-[var(--ink-1)] transition-colors outline-none aria-expanded:bg-[var(--bg-3)]">
        <Tv className="size-3.5" />
        <span>{label}</span>
        <ChevronDown className="size-3.5 text-[var(--ink-3)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {FORMAT_VALUES.map((v) => (
          <DropdownMenuCheckboxItem
            key={v}
            checked={selected.includes(v)}
            onCheckedChange={() => toggle(v)}
            closeOnClick={false}
          >
            {LABELS[v]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
