import { Suspense } from 'react';

import { MatchResults } from '@/features/match/components/match-results';
import { MatchResultsSkeleton } from '@/features/match/components/match-results-skeleton';
import { UsernameListForm } from '@/features/match/components/username-list-form';
import { parseUsernamesFromSearchParams } from '@/features/match/validation/match-request';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const users = parseUsernamesFromSearchParams(sp);
  const hasUsers = users.length >= 2;
  // Re-key the form + suspense boundary on the username set so URL-driven
  // changes (back/forward, shared link) remount uncontrolled inputs and reset
  // the skeleton fallback instead of reconciling against a stale tree.
  const usersKey = users.map((u) => `${u.provider}:${u.username}`).join('|');

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">whatnow.moe</h1>
        <p className="text-muted-foreground text-lg">
          Find anime you and your friends all want to watch.
        </p>
      </div>

      <UsernameListForm key={`form:${usersKey}`} initialUsernames={users.map((u) => u.username)} />

      {hasUsers && (
        <Suspense key={`results:${usersKey}`} fallback={<MatchResultsSkeleton />}>
          <MatchResults users={users} onlyFinished />
        </Suspense>
      )}
    </main>
  );
}
