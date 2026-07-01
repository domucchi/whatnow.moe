'use client';

import { parseAsStringEnum, useQueryState } from 'nuqs';
import { LayoutGrid, List } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { VIEW_VALUES, type ViewValue } from '@/features/match/validation/match-request';

export function ViewToggle() {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringEnum<ViewValue>([...VIEW_VALUES])
      .withDefault('grid')
      .withOptions({
        clearOnDefault: true,
        history: 'replace',
      }),
  );

  const set = (next: ViewValue) => {
    void setView(next === 'grid' ? null : next);
  };

  return (
    <ToggleGroup
      aria-label="Results view"
      value={[view]}
      onValueChange={(next) => {
        const selected = next[0] as ViewValue | undefined;
        if (selected) set(selected);
      }}
      spacing={0}
      className="flex rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] p-[3px]"
    >
      <ViewButton label="Grid view" value="grid">
        <LayoutGrid className="size-3.5" />
      </ViewButton>
      <ViewButton label="List view" value="list">
        <List className="size-3.5" />
      </ViewButton>
    </ToggleGroup>
  );
}

function ViewButton({
  label,
  value,
  children,
}: {
  label: string;
  value: ViewValue;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={label}
      className={cn(
        'grid min-h-0 min-w-0 place-items-center rounded-[7px] border px-2 py-1.5 transition-colors',
        'hover:text-foreground border-transparent bg-transparent text-[var(--ink-3)]',
        'data-pressed:text-foreground data-pressed:border-[var(--line)] data-pressed:bg-[var(--bg-0)]',
      )}
    >
      {children}
    </ToggleGroupItem>
  );
}
