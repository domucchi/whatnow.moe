import { Users } from 'lucide-react';

export function MatchEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 py-20 text-center">
      <div
        className="grid size-16 place-items-center rounded-full border border-dashed border-[var(--line)] text-[var(--ink-2)]"
        aria-hidden
      >
        <Users className="size-7" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-display text-foreground text-[30px] font-extrabold tracking-[-0.03em]">
          What&rsquo;ll we watch tonight?
        </div>
        <div className="font-display text-[13px] font-medium tracking-[0.2em] text-[var(--accent-soft)]">
          こんばんは
        </div>
        <p className="mx-auto mt-1.5 max-w-[380px] text-[13px] text-[var(--ink-2)]">
          Drop 2+ AniList usernames on the left. We&rsquo;ll find the anime sitting in
          everyone&rsquo;s planning list.
        </p>
      </div>
    </div>
  );
}

export function MatchNoResults() {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-10 py-20 text-center text-[var(--ink-3)]">
      <div className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--ink-1)]">
        No overlap just yet〜
      </div>
      <div className="text-[13px] text-[var(--ink-2)]">
        Loosen your filters, or switch to &ldquo;Any 2+&rdquo; match mode.
      </div>
    </div>
  );
}
