'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitMatch, type SubmitMatchState } from '@/features/match/api/submit-match';

const MIN_ROWS = 2;
const MAX_ROWS = 10;
const initialState: SubmitMatchState = {};

type Props = {
  initialUsernames?: string[];
};

export function UsernameListForm({ initialUsernames = [] }: Props) {
  const [state, formAction, pending] = useActionState(submitMatch, initialState);
  // Seed row count from `initialUsernames` so deep links (`/?u=alice&u=bob&u=cho`)
  // land with the right number of pre-filled rows. The parent re-keys this
  // component when the URL changes, so we don't need to sync state afterward.
  const [rowIds, setRowIds] = useState<number[]>(() => {
    const count = Math.min(MAX_ROWS, Math.max(MIN_ROWS, initialUsernames.length));
    return Array.from({ length: count }, (_, i) => i);
  });

  const addRow = () => {
    setRowIds((prev) => (prev.length >= MAX_ROWS ? prev : [...prev, Math.max(-1, ...prev) + 1]));
  };
  const removeRow = (id: number) => {
    setRowIds((prev) => (prev.length <= MIN_ROWS ? prev : prev.filter((x) => x !== id)));
  };

  const formError = state.errors?.formErrors?.[0];
  const usernameErrors = state.errors?.fieldErrors?.['usernames'];

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-3">
        {rowIds.map((id, idx) => (
          <div key={id} className="flex items-center gap-2">
            <Label htmlFor={`username-${idx}`} className="sr-only">
              User {idx + 1}
            </Label>
            <Input
              id={`username-${idx}`}
              name={`username-${idx}`}
              placeholder={`AniList username ${idx + 1}`}
              defaultValue={initialUsernames[idx] ?? ''}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={32}
              required
              className="flex-1"
            />
            {rowIds.length > MIN_ROWS && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(id)}
                aria-label={`Remove user ${idx + 1}`}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {(formError || usernameErrors?.length) && (
        <ul className="text-destructive text-sm" aria-live="polite">
          {formError && <li>{formError}</li>}
          {usernameErrors?.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          disabled={rowIds.length >= MAX_ROWS}
        >
          + Add user
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Finding matches…' : 'Find matches'}
        </Button>
      </div>
    </form>
  );
}
