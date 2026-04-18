'use server';

import { redirect } from 'next/navigation';

import { MatchRequestSchema } from '@/features/match/validation/match-request';

/**
 * Shape returned to `useActionState` on the client.
 *
 * On success we `redirect(...)` which throws a special marker Next intercepts,
 * so callers never read the success branch — but the type still needs to be
 * settled so useActionState's initialState type lines up.
 */
export type SubmitMatchState = {
  errors?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

export async function submitMatch(
  _prev: SubmitMatchState,
  formData: FormData,
): Promise<SubmitMatchState> {
  // The form submits fields named `username-0`, `username-1`, ... so we can
  // preserve row order and surface per-row errors back to the client.
  const usernames: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('username-') && typeof value === 'string' && value.trim() !== '') {
      usernames.push(value);
    }
  }

  const parsed = MatchRequestSchema.safeParse({ usernames });
  if (!parsed.success) {
    return { errors: parsed.error.flatten() };
  }

  console.log('parsed', parsed);

  // Route-aware redirect. `parsed.data.usernames` is already deduped + lowered.
  redirect(`/match/${parsed.data.usernames.join('/')}`);
}
