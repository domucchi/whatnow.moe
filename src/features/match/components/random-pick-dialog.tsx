'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Play, RefreshCw, Sparkles, X } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AnimeWithMatchInfo } from '@/features/match/types';

import { AvatarStack } from './avatar-stack';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: AnimeWithMatchInfo[];
  usernames: string[];
};

type Phase = 'idle' | 'spinning' | 'landed';

// Spin cadence — starts fast (50ms), decelerates quadratically toward ~450ms
// on the last tick so the landing feels intentional.
const TOTAL_TICKS = 28;
function tickDelay(tick: number): number {
  return 50 + Math.pow(tick / TOTAL_TICKS, 2.2) * 400;
}

export function RandomPickDialog({ open, onOpenChange, candidates, usernames }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // `setState`-heavy operations live inside `setTimeout` callbacks so the
  // `react-hooks/set-state-in-effect` rule stays happy (synchronous setState
  // inside an effect body causes cascading renders).
  const runSpin = (totalTicks = TOTAL_TICKS) => {
    if (candidates.length === 0) return;
    clearTimer();
    let tick = 0;
    const step = () => {
      setPhase('spinning');
      setCurrentIdx(Math.floor(Math.random() * candidates.length));
      tick += 1;
      if (tick < totalTicks) {
        timerRef.current = setTimeout(step, tickDelay(tick));
      } else {
        timerRef.current = setTimeout(() => {
          setCurrentIdx(Math.floor(Math.random() * candidates.length));
          setPhase('landed');
        }, tickDelay(tick));
      }
    };
    timerRef.current = setTimeout(step, 50);
  };

  useEffect(() => {
    if (open) {
      runSpin();
    } else {
      clearTimer();
      // Defer the phase reset so the effect body itself contains no synchronous
      // setState. Consumers don't observe 'idle' while open.
      const t = setTimeout(() => setPhase('idle'), 0);
      return () => clearTimeout(t);
    }
    return clearTimer;
    // `runSpin` closes over `candidates`; rerunning on open covers the case
    // where the user filtered between openings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = candidates[currentIdx] ?? candidates[0];
  if (candidates.length === 0 || !current) return null;

  const title = current.titleEnglish ?? current.titleRomaji ?? 'Unknown title';
  const href = current.siteUrl ?? `https://anilist.co/anime/${current.id}`;
  const matchedEntries = current.matchedUsers
    .map((u) => ({ username: u, colorIndex: usernames.indexOf(u) }))
    .filter((e) => e.colorIndex >= 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(12,10,8,0.72)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-md" />
        <Dialog.Popup
          className={cn(
            'fixed top-1/2 left-1/2 z-50 w-[min(560px,calc(100vw-3rem))] -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-[var(--line-soft)] bg-[var(--bg-1)] p-7',
            'shadow-2xl transition duration-200',
            'data-ending-style:opacity-0 data-starting-style:opacity-0',
          )}
        >
          <Dialog.Title className="sr-only">Random pick</Dialog.Title>
          <Dialog.Description className="sr-only">
            A randomly selected anime from your matches.
          </Dialog.Description>
          <Dialog.Close
            aria-label="Close"
            className="hover:text-foreground absolute top-4 right-4 grid place-items-center rounded-lg p-1.5 text-[var(--ink-3)]"
          >
            <X className="size-4" />
          </Dialog.Close>

          <div className="text-[11px] tracking-[0.18em] text-[var(--ink-3)] uppercase">
            {phase === 'spinning' ? 'Rolling…' : 'Your pick'}
          </div>
          <div
            className="font-display text-[32px] leading-[1.15] font-extrabold tracking-[-0.025em]"
            aria-live="polite"
          >
            {phase === 'spinning' ? 'One of these…' : 'Tonight you\u2019re watching'}
          </div>

          <div className="mt-5 flex items-stretch gap-5">
            <div className="relative w-[140px] shrink-0">
              <div
                key={`${current.id}-${phase}`}
                className={phase === 'landed' ? 'animate-pop' : undefined}
              >
                <Poster anime={current} />
              </div>
              {phase === 'landed' && (
                <div
                  className="animate-pop absolute -top-2 -right-2 grid size-[34px] place-items-center rounded-full bg-[var(--color-primary)] text-[#1a0f0a]"
                  style={{ animationDelay: '0.1s' }}
                >
                  <Sparkles className="size-4" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="text-lg font-semibold tracking-[-0.01em]">{title}</div>
              <div className="mt-2 flex items-center gap-2.5 text-[12.5px] text-[var(--ink-2)]">
                {current.averageScore !== null && (
                  <span
                    className={cn(
                      'tabular-nums',
                      current.averageScore >= 85 && 'text-[var(--accent-soft)]',
                    )}
                  >
                    ★ {current.averageScore}%
                  </span>
                )}
                {current.seasonYear !== null && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="tabular-nums">{current.seasonYear}</span>
                  </>
                )}
                {current.episodes !== null && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{current.format === 'MOVIE' ? 'Film' : `${current.episodes} ep`}</span>
                  </>
                )}
              </div>
              {current.genres.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {current.genres.map((g) => (
                    <span
                      key={g}
                      className="inline-block rounded-[4px] border border-[var(--line-soft)] px-2 py-0.5 text-[11px] text-[var(--ink-2)]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3.5 border-t border-dashed border-[var(--line-soft)] pt-3">
                <div className="mb-2 text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">
                  Matched with
                </div>
                <div className="flex items-center gap-2">
                  <AvatarStack entries={matchedEntries} size={24} />
                  <div className="text-[12.5px] text-[var(--ink-1)]">
                    {current.matchedUsers.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => runSpin(22)}
              disabled={phase === 'spinning'}
            >
              <RefreshCw data-icon="inline-start" className="size-3.5" />
              Roll again
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Maybe later
            </Button>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'default', size: 'default' }),
                phase === 'spinning' && 'pointer-events-none opacity-50',
              )}
              aria-disabled={phase === 'spinning'}
            >
              <Play data-icon="inline-start" className="size-3.5" />
              Lock it in
            </a>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Poster({ anime }: { anime: AnimeWithMatchInfo }) {
  const src = anime.coverLarge ?? anime.coverMedium;
  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--radius)] bg-[var(--bg-2)]"
      style={{ aspectRatio: '2 / 3' }}
    >
      {src && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${src}')` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}
