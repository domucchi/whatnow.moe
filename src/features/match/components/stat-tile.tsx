type Props = {
  label: string;
  value: string | number;
};

export function StatTile({ label, value }: Props) {
  return (
    <div className="rounded-[8px] border border-[var(--line-soft)] bg-[var(--bg-2)] px-3 py-2.5">
      <div className="font-display text-foreground text-[26px] leading-none font-extrabold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[11px] tracking-[0.1em] text-[var(--ink-3)] uppercase">{label}</div>
    </div>
  );
}
