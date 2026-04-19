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

export const SORT_VALUES = [
  'matches',
  'score',
  'popularity',
  'year-desc',
  'year-asc',
  'title',
  'episodes',
] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const FORMAT_VALUES = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'] as const;
export type FormatValue = (typeof FORMAT_VALUES)[number];

export const MODE_VALUES = ['any', 'all'] as const;
export type ModeValue = (typeof MODE_VALUES)[number];

export const VIEW_VALUES = ['grid', 'list'] as const;
export type ViewValue = (typeof VIEW_VALUES)[number];

export const YEAR_MIN = 1960;
export const YEAR_MAX = new Date().getFullYear() + 1;
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

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

  genres: z.array(z.string()).optional(),
  formats: z.array(z.enum(FORMAT_VALUES)).optional(),
  yearMin: z.number().int().min(YEAR_MIN).max(YEAR_MAX).optional(),
  yearMax: z.number().int().min(YEAR_MIN).max(YEAR_MAX).optional(),
  scoreMin: z.number().int().min(SCORE_MIN).max(SCORE_MAX).optional(),
  scoreMax: z.number().int().min(SCORE_MIN).max(SCORE_MAX).optional(),
  // Default `false`: only finished anime unless the user opts in. Renamed from
  // Phase 1's `onlyFinished` to match the URL key and the switch label.
  includeAiring: z.boolean().default(false),
  sort: z.enum(SORT_VALUES).default('matches'),
  mode: z.enum(MODE_VALUES).default('any'),
  view: z.enum(VIEW_VALUES).default('grid'),
});

export type MatchRequestInput = z.input<typeof MatchRequestSchema>;
export type MatchRequestOutput = z.output<typeof MatchRequestSchema>;

export type MatchFilters = Omit<MatchRequestOutput, 'usernames'>;

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

export function parseUsernamesFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): UserIdentifier[] {
  const raw = searchParams['u'];
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map(parseUsernameSegment);
}

function asArray(raw: string | string[] | undefined): string[] {
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function asInt(raw: string | string[] | undefined): number | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v === '') return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function asBool(raw: string | string[] | undefined): boolean | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return undefined;
}

function asEnum<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined) return undefined;
  return (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

// Parses every Phase 2 filter knob from URL search params. Values default to
// the Zod schema defaults when missing/invalid so URLs can omit defaults.
export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): MatchFilters {
  const genres = asArray(searchParams['genre']).filter((g) => g.length > 0);
  const formatsRaw = asArray(searchParams['format']);
  const formats = formatsRaw.filter((f): f is FormatValue =>
    (FORMAT_VALUES as readonly string[]).includes(f),
  );

  const yearMin = asInt(searchParams['yearMin']);
  const yearMax = asInt(searchParams['yearMax']);
  const scoreMin = asInt(searchParams['scoreMin']);
  const scoreMax = asInt(searchParams['scoreMax']);
  const includeAiring = asBool(searchParams['includeAiring']) ?? false;

  return {
    genres: genres.length > 0 ? genres : undefined,
    formats: formats.length > 0 ? formats : undefined,
    yearMin:
      yearMin !== undefined && yearMin >= YEAR_MIN && yearMin <= YEAR_MAX ? yearMin : undefined,
    yearMax:
      yearMax !== undefined && yearMax >= YEAR_MIN && yearMax <= YEAR_MAX ? yearMax : undefined,
    scoreMin:
      scoreMin !== undefined && scoreMin >= SCORE_MIN && scoreMin <= SCORE_MAX
        ? scoreMin
        : undefined,
    scoreMax:
      scoreMax !== undefined && scoreMax >= SCORE_MIN && scoreMax <= SCORE_MAX
        ? scoreMax
        : undefined,
    includeAiring,
    sort: asEnum(searchParams['sort'], SORT_VALUES) ?? 'matches',
    mode: asEnum(searchParams['mode'], MODE_VALUES) ?? 'any',
    view: asEnum(searchParams['view'], VIEW_VALUES) ?? 'grid',
  };
}
