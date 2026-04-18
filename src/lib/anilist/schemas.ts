import { z } from 'zod';

/**
 * Zod schemas mirroring the AniList GraphQL response shape.
 *
 * Enum-ish fields (`format`, `status`) are left as strings because AniList
 * occasionally adds new values and we don't want a parse failure the day
 * they do. The DB columns are `text`, so any string round-trips fine.
 */

export const AnilistMediaSchema = z.object({
  id: z.number().int(),
  idMal: z.number().int().nullable(),
  title: z.object({
    romaji: z.string().nullable(),
    english: z.string().nullable(),
  }),
  genres: z.array(z.string()),
  averageScore: z.number().int().nullable(),
  popularity: z.number().int().nullable(),
  episodes: z.number().int().nullable(),
  format: z.string().nullable(),
  status: z.string().nullable(),
  seasonYear: z.number().int().nullable(),
  siteUrl: z.string().nullable(),
  coverImage: z.object({
    medium: z.string().nullable(),
    large: z.string().nullable(),
  }),
});
export type AnilistMedia = z.infer<typeof AnilistMediaSchema>;

export const MediaListEntrySchema = z.object({
  media: AnilistMediaSchema,
});
export type MediaListEntry = z.infer<typeof MediaListEntrySchema>;

export const MediaListCollectionSchema = z
  .object({
    lists: z.array(
      z.object({
        entries: z.array(MediaListEntrySchema),
      }),
    ),
  })
  .nullable(); // AniList returns `null` when the user does not exist.

export const PlanningListResponseSchema = z.object({
  data: z.object({
    MediaListCollection: MediaListCollectionSchema,
  }),
});
export type PlanningListResponse = z.infer<typeof PlanningListResponseSchema>;

/**
 * AniList's standard error envelope, shaped like `{ errors: [{ message, ... }] }`.
 * We don't currently branch on it but it's nice to parse so we can surface the
 * message in logs.
 */
export const AnilistErrorResponseSchema = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
      status: z.number().int().optional(),
    }),
  ),
});
