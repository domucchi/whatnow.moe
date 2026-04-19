type Props = {
  value: number;
  max?: number;
  width?: number;
  height?: number;
  accent?: boolean;
};

export function ScoreBar({ value, max = 100, width = 56, height = 4, accent = false }: Props) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div
      className="overflow-hidden rounded-sm bg-[var(--bg-3)]"
      style={{ width, height }}
      aria-hidden
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: accent ? 'var(--color-primary)' : 'var(--ink-1)',
        }}
      />
    </div>
  );
}
