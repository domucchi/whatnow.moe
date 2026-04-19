import { cn } from '@/lib/utils';

type Props = {
  matched: number;
  total: number;
  className?: string;
};

export function MatchRatioPill({ matched, total, className }: Props) {
  const full = matched === total;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-[7px] py-[2px] text-[11px] font-medium tabular-nums',
        full
          ? 'border-primary/25 bg-[var(--accent-dim)] text-[var(--accent-soft)]'
          : 'border-[var(--line-soft)] bg-[var(--bg-2)] text-[var(--ink-2)]',
        className,
      )}
    >
      {matched}/{total}
    </span>
  );
}
