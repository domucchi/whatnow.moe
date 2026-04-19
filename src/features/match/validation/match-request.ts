import { z } from 'zod';

import type { ListProvider } from '@/lib/anilist/errors';
import type { UserIdentifier } from '@/features/match/types';

// Broader than either provider's own rule (AniList: 2–20, MAL: 2–16) — let
// the provider reject what it doesn't like. The regex also blocks URL-segment
// injection from the catch-all route into our SQL.
const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,32}$/;

export const UsernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_PATTERN, 'Letters, digits, and underscores only (max 32 chars).');

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

  // Phase 1 only reads `onlyFinished`; the rest are stubs for Phase 2.
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

  // Unknown prefix — fall back to AniList rather than silently misrouting.
  return { provider: 'anilist', username: segment.toLowerCase() };
}
