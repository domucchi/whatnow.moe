'use client';

import { parseAsStringEnum, useQueryState } from 'nuqs';
import { LayoutGrid, List } from 'lucide-react';

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
    <div className="flex rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] p-[3px]">
      <ViewButton label="Grid view" active={view === 'grid'} onClick={() => set('grid')}>
        <LayoutGrid className="size-3.5" />
      </ViewButton>
      <ViewButton label="List view" active={view === 'list'} onClick={() => set('list')}>
        <List className="size-3.5" />
      </ViewButton>
    </div>
  );
}

function ViewButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'grid place-items-center rounded-[7px] border px-2 py-1.5 transition-colors',
        active
          ? 'text-foreground border-[var(--line)] bg-[var(--bg-0)]'
          : 'hover:text-foreground border-transparent text-[var(--ink-3)]',
      )}
    >
      {children}
    </button>
  );
}
