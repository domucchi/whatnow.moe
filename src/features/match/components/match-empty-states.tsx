import { Users } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function MatchEmptyState() {
  return (
    <Empty className="gap-4 rounded-none border-0 px-10 py-20">
      <EmptyHeader className="gap-1">
        <EmptyMedia
          className="grid size-16 place-items-center rounded-full border border-dashed border-[var(--line)] text-[var(--ink-2)]"
          aria-hidden
        >
          <Users className="size-7" />
        </EmptyMedia>
        <h1 className="font-display text-foreground text-[30px] font-extrabold tracking-[-0.03em]">
          What&rsquo;ll we watch tonight?
        </h1>
        <div className="font-display text-[13px] font-medium tracking-[0.2em] text-[var(--accent-soft)]">
          こんばんは
        </div>
        <EmptyDescription className="mx-auto mt-1.5 max-w-[380px] text-[13px] text-[var(--ink-2)]">
          Drop 2+ AniList usernames on the left. We&rsquo;ll find the anime sitting in
          everyone&rsquo;s planning list.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function MatchNoResults() {
  return (
    <Empty className="items-center gap-2 rounded-none border-0 px-10 py-20 text-[var(--ink-3)]">
      <EmptyHeader className="gap-2">
        <EmptyTitle className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--ink-1)]">
          No overlap just yet〜
        </EmptyTitle>
        <EmptyDescription className="text-[13px] text-[var(--ink-2)]">
          Loosen your filters, or switch to &ldquo;Any 2+&rdquo; match mode.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
