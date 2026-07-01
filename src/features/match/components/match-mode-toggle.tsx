'use client';

import { parseAsStringEnum, useQueryState } from 'nuqs';
import { Check, Users } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { MODE_VALUES, type ModeValue } from '@/features/match/validation/match-request';

type Props = {
  userCount: number;
  // `urlSync` disabled lets the sidebar render this on the empty-state page
  // before the URL has any filter params; the value is still surfaced, but
  // it won't rewrite the URL on select.
  urlSync?: boolean;
};

// Mirrors the design: only meaningful at 3+ users — with 2 users "Any 2+" and
// "All N" collapse to the same thing.
export function MatchModeToggle({ userCount, urlSync = true }: Props) {
  const [mode, setMode] = useQueryState(
    'mode',
    parseAsStringEnum([...MODE_VALUES])
      .withDefault('any')
      .withOptions({
        clearOnDefault: true,
        history: 'replace',
      }),
  );

  if (userCount < 3) return null;

  const handle = (next: ModeValue) => {
    if (!urlSync) return;
    void setMode(next === 'any' ? null : next);
  };

  return (
    <div>
      <div className="mb-2 text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">
        Match Mode
      </div>
      <ToggleGroup
        aria-label="Match mode"
        value={[mode]}
        onValueChange={(next) => {
          const selected = next[0] as ModeValue | undefined;
          if (selected) handle(selected);
        }}
        spacing={1}
        className="grid w-full grid-cols-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--bg-2)] p-1"
      >
        <ModeButton
          value="all"
          icon={<Check className="size-3" />}
          label={`All ${userCount}`}
          sub="strict match"
        />
        <ModeButton
          value="any"
          icon={<Users className="size-3" />}
          label="Any 2+"
          sub="loose match"
        />
      </ToggleGroup>
    </div>
  );
}

function ModeButton({
  value,
  icon,
  label,
  sub,
}: {
  value: ModeValue;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <ToggleGroupItem
      value={value}
      className={cn(
        'min-h-0 w-full rounded-[7px] border px-2 py-2 text-[12.5px] font-medium transition-colors',
        'hover:text-foreground border-transparent bg-transparent text-[var(--ink-2)]',
        'data-pressed:text-foreground data-pressed:border-[var(--line)] data-pressed:bg-[var(--bg-0)]',
      )}
    >
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-[10.5px] font-normal text-[var(--ink-3)]">{sub}</div>
    </ToggleGroupItem>
  );
}
