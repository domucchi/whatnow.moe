import { z } from 'zod';

import type { ListProvider } from '@/lib/anilist/errors';
import type { UserIdentifier } from '@/features/match/types';

/**
 * AniList usernames are 2–20 alphanumeric + underscore. MAL's allow 2–16.
 * We apply the broader rule (plus a cap of 32 for safety) and let the
 * provider reject anything it doesn't like. The regex also stops attackers
 * from sneaking URL segments through the catch-all route into our SQL.
 */
const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,32}$/;

export const UsernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_PATTERN, 'Letters, digits, and underscores only (max 32 chars).');

/**
 * Shared validation schema for both the form submission (Server Action) and
 * anywhere else a match request needs to be validated.
 *
 * Phase 2 fields (`genres`, `formats`, year range, etc.) are declared as
 * optional now so the TypeScript shape is stable — their values aren't
 * surfaced in the UI yet.
 */
export const MatchRequestSchema = z.object({
  usernames: z
    .array(UsernameSchema)
    .min(1, 'Add at least one username.')
    .transform((names) => Array.from(new Set(names.map((n) => n.toLowerCase()))))
    .refine((names) => names.length >= 2, {
      message: 'Need at least 2 distinct usernames.',
    })
    .refine((names) => names.length <= 10, {
      message: 'Maximum 10 users per match.',
    }),

  // Phase 1 only uses `onlyFinished`. Others are stubbed for Phase 2.
  onlyFinished: z.boolean().default(true),
  genres: z.array(z.string()).optional(),
  formats: z.array(z.string()).optional(),
  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  includeAiring: z.boolean().optional(),
  sort: z.enum(['matches', 'score', 'popularity', 'year']).optional(),
  mode: z.enum(['any', 'all']).optional(),
});

export type MatchRequestInput = z.input<typeof MatchRequestSchema>;
export type MatchRequestOutput = z.output<typeof MatchRequestSchema>;

/**
 * Parse a single `/match/[...usernames]` URL segment into a `UserIdentifier`.
 * Accepts bare names today (`alice`) and optional provider prefixes later
 * (`mal:alice`) — when MAL ships, no Phase 1 URL breaks.
 */
const KNOWN_PROVIDERS: readonly ListProvider[] = ['anilist', 'mal'];

export function parseUsernameSegment(segment: string): UserIdentifier {
  const colon = segment.indexOf(':');
  if (colon === -1) {
    return { provider: 'anilist', username: segment.toLowerCase() };
  }

  const prefix = segment.slice(0, colon).toLowerCase();
  const rest = segment.slice(colon + 1);

  if ((KNOWN_PROVIDERS as readonly string[]).includes(prefix)) {
    return { provider: prefix as ListProvider, username: rest.toLowerCase() };
  }

  // Unknown prefix — treat the whole segment as an AniList username so we
  // don't silently misroute.
  return { provider: 'anilist', username: segment.toLowerCase() };
}
