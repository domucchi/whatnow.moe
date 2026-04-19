import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { getMatches } from '@/features/match/api/get-matches';
import { MatchSection } from '@/features/match/components/match-section';
import { parseUsernameSegment } from '@/features/match/validation/match-request';

type Props = {
  params: Promise<{ usernames: string[] }>;
};

export default async function MatchPage({ params }: Props) {
  const { usernames: rawSegments } = await params;

  // 404 outside the 2–10 range so the catch-all doesn't render an empty page
  // for malformed URLs.
  if (rawSegments.length < 2 || rawSegments.length > 10) {
    notFound();
  }

  const users = rawSegments.map(parseUsernameSegment);
  const result = await getMatches({ users, onlyFinished: true });
  const totalUsers = users.length;
  const humanList = users.map((u) => u.username).join(', ');

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">Matches for</p>
          <h1 className="text-2xl font-semibold tracking-tight">{humanList}</h1>
        </div>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Edit users
        </Link>
      </header>

      {result.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-lg font-medium">No overlaps yet.</p>
          <p className="text-muted-foreground max-w-md text-sm">
            None of these users share a finished anime in their PLANNING list. Try adding another
            user or check the spelling.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {result.map((group) => (
            <MatchSection key={group.matchCount} group={group} totalUsers={totalUsers} />
          ))}
        </div>
      )}
    </main>
  );
}
