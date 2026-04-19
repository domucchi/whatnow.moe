import { Suspense } from 'react';

import { getGenres } from '@/lib/anilist/genres';
import { MatchResults } from '@/features/match/components/match-results';
import { MatchResultsSkeleton } from '@/features/match/components/match-results-skeleton';
import { MatchSidebar } from '@/features/match/components/match-sidebar';
import { parseUsernamesFromSearchParams } from '@/features/match/validation/match-request';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const users = parseUsernamesFromSearchParams(sp);
  const initialUsernames = users.map((u) => u.username);

  // Suspense key hashes only `users` — filter / sort / mode / view are all
  // applied client-side, so changing them must not re-suspend.
  const resultsKey = initialUsernames.join('|');

  // Genres load alongside the match fetch — static for a given process, so
  // effectively free after the first request.
  const genres = await getGenres();

  return (
    <Suspense
      key={resultsKey}
      fallback={<SidebarWithSkeleton initialUsernames={initialUsernames} />}
    >
      <MatchResults users={users} genres={genres} initialUsernames={initialUsernames} />
    </Suspense>
  );
}

// Keeps the sidebar painted while the results pane streams in — feels much
// snappier than blanking the whole screen on submit.
function SidebarWithSkeleton({ initialUsernames }: { initialUsernames: string[] }) {
  return (
    <div className="flex min-h-full w-full flex-col lg:flex-row">
      <MatchSidebar
        initialUsernames={initialUsernames}
        started={initialUsernames.length >= 2}
        matches={[]}
        stats={null}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <MatchResultsSkeleton />
      </main>
    </div>
  );
}
