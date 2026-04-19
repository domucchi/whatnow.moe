import { cn } from '@/lib/utils';

// Palette order mirrors the design prototype (coral first, then cool tones
// cycling through sky / mint / lilac / gold / rose). Users past index 5 wrap.
export const USER_COLORS = [
  'var(--color-primary)',
  'var(--color-sky)',
  'var(--color-mint)',
  'var(--color-lilac)',
  'var(--color-gold)',
  'var(--color-rose)',
] as const;

export function colorForIndex(i: number): string {
  return USER_COLORS[i % USER_COLORS.length] ?? USER_COLORS[0]!;
}

export function initialFor(username: string, fallbackIndex = 0): string {
  const trimmed = username.trim();
  if (trimmed.length > 0) return trimmed[0]!.toUpperCase();
  return 'DNKAMX'[fallbackIndex % 6] ?? '?';
}

type Props = {
  username: string;
  colorIndex: number;
  size?: number;
  ring?: boolean;
  className?: string;
};

export function Avatar({ username, colorIndex, size = 22, ring = false, className }: Props) {
  const initial = initialFor(username, colorIndex);
  return (
    <div
      title={username}
      aria-hidden
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-medium tracking-tight text-[#1a1512]',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.48,
        background: colorForIndex(colorIndex),
        boxShadow: ring ? '0 0 0 2px var(--bg-1)' : undefined,
      }}
    >
      {initial}
    </div>
  );
}
