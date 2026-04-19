'use client';

import { useActionState, useState } from 'react';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';

import Link from 'next/link';

import { Button, buttonVariants } from '@/components/ui/button';
import { submitMatch, type SubmitMatchState } from '@/features/match/api/submit-match';
import type { AnimeWithMatchInfo, MatchStats } from '@/features/match/types';
import { cn } from '@/lib/utils';

import { Avatar } from './avatar';
import { MatchModeToggle } from './match-mode-toggle';
import { RandomPickButton } from './random-pick-button';
import { StatTile } from './stat-tile';
import { UserChip } from './user-chip';

const MIN_ROWS = 2;
const MAX_ROWS = 10;
const initialState: SubmitMatchState = {};

type Props = {
  initialUsernames: string[];
  started: boolean;
  matches: AnimeWithMatchInfo[];
  stats: MatchStats | null;
};

export function MatchSidebar({ initialUsernames, started, matches, stats }: Props) {
  const [state, formAction, pending] = useActionState(submitMatch, initialState);

  // Rows carry a stable id (for React key) + the current input value. Seeded
  // from the URL-derived `initialUsernames` on mount; the parent re-keys the
  // sidebar when the URL changes, so a fresh set lands on every match.
  const [rows, setRows] = useState<{ id: number; value: string }[]>(() => {
    const count = Math.min(MAX_ROWS, Math.max(MIN_ROWS, initialUsernames.length));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      value: initialUsernames[i] ?? '',
    }));
  });

  const addRow = () => {
    setRows((prev) =>
      prev.length >= MAX_ROWS
        ? prev
        : [...prev, { id: Math.max(-1, ...prev.map((r) => r.id)) + 1, value: '' }],
    );
  };
  const removeRow = (id: number) => {
    setRows((prev) => (prev.length <= MIN_ROWS ? prev : prev.filter((r) => r.id !== id)));
  };
  const setRowValue = (id: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
  };

  const formError = state.errors?.formErrors?.[0];
  const usernameErrors = state.errors?.fieldErrors?.['usernames'];
  const canAdd = rows.length < MAX_ROWS;
  const canRemove = rows.length > MIN_ROWS;

  // Normalize the same way `submitMatch` does on the server (trim + lowercase
  // + dedupe), then compare against the initial URL set to decide whether to
  // show "Match now" instead of "Random pick".
  const currentNormalized = Array.from(
    new Set(rows.map((r) => r.value.trim().toLowerCase()).filter(Boolean)),
  );
  const initialNormalized = Array.from(new Set(initialUsernames.map((u) => u.toLowerCase())));
  const isDirty = !arraysEqual(currentNormalized, initialNormalized);
  const canSubmit = currentNormalized.length >= 2;

  // Derived stats for the sidebar display. Avg score + median year come from
  // the *visible* match rows, so they track filter changes.
  const avgScore = computeAvgScore(matches);
  const medianYear = computeMedianYear(matches);

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--sidebar)] lg:sticky lg:top-0 lg:h-screen lg:w-[320px] lg:shrink-0 lg:border-r lg:border-[var(--line-soft)]">
      <Brand />

      <form action={formAction} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col gap-[22px] px-6 py-5">
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">
                Users · <span className="text-[var(--ink-1)]">{rows.length}</span>
              </div>
              {canAdd && (
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-[var(--accent-soft)]"
                >
                  <Plus className="size-3" /> Add
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {rows.map((row, idx) => (
                <UserChip
                  key={row.id}
                  index={idx}
                  value={row.value}
                  onValueChange={(v) => setRowValue(row.id, v)}
                  canRemove={canRemove}
                  onRemove={() => removeRow(row.id)}
                  loading={pending && !!row.value.trim()}
                />
              ))}
            </div>

            <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
              Enter 2 – 10 AniList usernames. We&rsquo;ll pull each person&rsquo;s{' '}
              <span className="text-[var(--ink-1)]">Planning</span> list and surface the overlap.
            </p>

            {(formError || usernameErrors?.length) && (
              <ul className="mt-3 text-xs text-[var(--accent-soft)]" aria-live="polite">
                {formError && <li>{formError}</li>}
                {usernameErrors?.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </section>

          {started && <MatchModeToggle userCount={rows.length} />}

          {started && stats && (
            <section className="flex flex-col gap-2.5">
              <DividerLabel label="Overlap" />
              <div className="grid grid-cols-2 gap-2">
                <StatTile label="Matches" value={matches.length} />
                <StatTile label="Scanned" value={stats.scanned} />
                <StatTile label="Avg. score" value={avgScore === null ? '–' : `${avgScore}%`} />
                <StatTile label="Median year" value={medianYear === null ? '–' : medianYear} />
              </div>

              <div className="mt-1 flex flex-col gap-1.5">
                {initialUsernames.map((username, i) => {
                  const count = stats.perUser[username] ?? 0;
                  const pct = stats.scanned > 0 ? (count / stats.scanned) * 100 : 0;
                  return (
                    <PerUserBar
                      key={username}
                      username={username}
                      colorIndex={i}
                      pct={pct}
                      count={count}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-[var(--line-soft)] px-6 pt-3.5 pb-5">
          {!started ? (
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full"
              disabled={pending || !canSubmit}
            >
              <Sparkles data-icon="inline-start" className="size-4" />
              {pending ? 'Matching…' : 'Find matches'}
            </Button>
          ) : isDirty ? (
            <>
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full"
                disabled={pending || !canSubmit}
              >
                <Sparkles data-icon="inline-start" className="size-4" />
                {pending ? 'Matching…' : 'Match now'}
              </Button>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 w-full')}
              >
                <RefreshCw data-icon="inline-start" className="size-3" />
                Start over
              </Link>
            </>
          ) : (
            <>
              <RandomPickButton candidates={matches} usernames={initialUsernames} />
              <Link
                href="/"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 w-full')}
              >
                <RefreshCw data-icon="inline-start" className="size-3" />
                Start over
              </Link>
            </>
          )}
          <p className="mt-0.5 text-center text-[10.5px] text-[var(--ink-3)]">
            whatnow.moe · anilist planning matcher
          </p>
        </div>
      </form>
    </aside>
  );
}

function Brand() {
  return (
    <div className="border-b border-[var(--line-soft)] px-6 pt-[22px] pb-[18px]">
      <div className="flex items-center gap-2.5">
        <BrandLogo />
        <div>
          <div
            className="text-base font-extrabold tracking-[-0.015em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            whatnow
            <span className="ml-0.5 text-[var(--color-primary)]">.moe</span>
          </div>
          <div className="text-[10.5px] tracking-[0.08em] text-[var(--ink-3)] uppercase">
            anilist・planning・matcher
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandLogo() {
  // Three overlapping circles → the intersection metaphor of the app.
  // Background `rect` matches the sidebar fill so the mark sits cleanly.
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="whatnow.moe logo"
      className="shrink-0"
    >
      <rect width="128" height="128" rx="24" fill="var(--sidebar)" />
      <g transform="translate(64, 68)">
        <circle cx="-20" cy="8" r="30" fill="var(--color-primary)" opacity="0.85" />
        <circle cx="20" cy="8" r="30" fill="var(--ink-0)" opacity="0.85" />
        <circle cx="0" cy="-20" r="30" fill="var(--color-primary)" opacity="0.6" />
      </g>
    </svg>
  );
}

function DividerLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[11px] tracking-[0.14em] text-[var(--ink-3)] uppercase">
      <span>{label}</span>
      <div className="h-px flex-1 bg-[var(--line-soft)]" />
    </div>
  );
}

function PerUserBar({
  username,
  colorIndex,
  pct,
  count,
}: {
  username: string;
  colorIndex: number;
  pct: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar username={username} colorIndex={colorIndex} size={18} />
      <div className="flex flex-1 items-center gap-2">
        <div
          className={cn(
            'w-[90px] overflow-hidden text-xs whitespace-nowrap text-[var(--ink-1)]',
            'text-ellipsis',
          )}
        >
          {username}
        </div>
        <div className="h-[3px] flex-1 overflow-hidden rounded-[2px] bg-[var(--bg-2)]">
          <div
            className="h-full"
            style={{
              width: `${pct}%`,
              background: `var(${USER_COLOR_VARS[colorIndex % USER_COLOR_VARS.length]})`,
              opacity: 0.85,
            }}
          />
        </div>
        <div className="w-7 text-right text-[11px] text-[var(--ink-3)] tabular-nums">{count}</div>
      </div>
    </div>
  );
}

const USER_COLOR_VARS = [
  '--color-primary',
  '--color-sky',
  '--color-mint',
  '--color-lilac',
  '--color-gold',
  '--color-rose',
] as const;

// Strict member equality. Both inputs are expected to be already normalized
// (trimmed / lowercased / deduped) — order-independent comparison via Set
// would be more forgiving but the server action preserves input order.
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function computeAvgScore(matches: AnimeWithMatchInfo[]): number | null {
  const scored = matches.filter((m) => m.averageScore !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((s, m) => s + (m.averageScore ?? 0), 0);
  return Math.round(sum / scored.length);
}

function computeMedianYear(matches: AnimeWithMatchInfo[]): number | null {
  const years = matches
    .map((m) => m.seasonYear)
    .filter((y): y is number => y !== null)
    .sort((a, b) => a - b);
  if (years.length === 0) return null;
  return years[Math.floor(years.length / 2)] ?? null;
}
