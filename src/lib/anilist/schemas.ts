import { z } from 'zod';

// `format` / `status` stay as strings (not enums) so a new AniList value
// doesn't cause a parse failure the day it ships; DB columns are `text`.
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
  .nullable(); // AniList returns null here when the user doesn't exist.

export const PlanningListResponseSchema = z.object({
  data: z.object({
    MediaListCollection: MediaListCollectionSchema,
  }),
});
export type PlanningListResponse = z.infer<typeof PlanningListResponseSchema>;

export const AnilistErrorResponseSchema = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
      status: z.number().int().optional(),
    }),
  ),
});
