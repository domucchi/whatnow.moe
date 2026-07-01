import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';

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
    <Progress value={pct} className="block" style={{ width, height }} aria-hidden>
      <ProgressTrack className="h-full bg-[var(--bg-3)]">
        <ProgressIndicator
          style={{ background: accent ? 'var(--color-primary)' : 'var(--ink-1)' }}
        />
      </ProgressTrack>
    </Progress>
  );
}
