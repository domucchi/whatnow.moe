import { getMatches } from '@/features/match/api/get-matches';
import { MatchResultsError } from '@/features/match/components/match-results-error';
import { MatchSection } from '@/features/match/components/match-section';
import type { MatchResult, UserIdentifier } from '@/features/match/types';

type Props = {
  users: UserIdentifier[];
  onlyFinished: boolean;
};

export async function MatchResults({ users, onlyFinished }: Props) {
  let result: MatchResult;
  try {
    result = await getMatches({ users, onlyFinished });
  } catch (err) {
    return <MatchResultsError error={err as Error} />;
  }

  const totalUsers = users.length;
  const humanList = users.map((u) => u.username).join(', ');

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Matches for</p>
        <h2 className="text-2xl font-semibold tracking-tight">{humanList}</h2>
      </header>

      {result.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
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
    </div>
  );
}
