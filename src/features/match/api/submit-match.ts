'use server';

import { redirect } from 'next/navigation';

import { MatchRequestSchema } from '@/features/match/validation/match-request';

// Success path calls `redirect()` (which throws a Next-internal marker), so
// only the error shape is ever observed by the client.
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
  // Per-row keys (`username-0`, `username-1`, …) preserve order so we can map
  // validation errors back to the right input.
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

  redirect(`/match/${parsed.data.usernames.join('/')}`);
}
