import { describe, expect, it } from 'bun:test';

import {
  emptyPlanningResponse,
  twoEntryPlanningResponse,
  userNotFoundResponse,
} from '@/testing/fixtures/anilist-responses';

import { PlanningListResponseSchema, AnilistMediaSchema } from './schemas';

describe('PlanningListResponseSchema', () => {
  it('accepts a response with entries', () => {
    const parsed = PlanningListResponseSchema.parse(twoEntryPlanningResponse);
    expect(parsed.data.MediaListCollection?.lists[0]?.entries).toHaveLength(2);
  });

  it('accepts an empty-lists response', () => {
    const parsed = PlanningListResponseSchema.parse(emptyPlanningResponse);
    expect(parsed.data.MediaListCollection?.lists).toEqual([]);
  });

  it('accepts a null MediaListCollection (user not found)', () => {
    const parsed = PlanningListResponseSchema.parse(userNotFoundResponse);
    expect(parsed.data.MediaListCollection).toBeNull();
  });

  it('rejects a malformed payload', () => {
    const result = PlanningListResponseSchema.safeParse({ data: null });
    expect(result.success).toBe(false);
  });
});

describe('AnilistMediaSchema', () => {
  it('accepts nullable title fields', () => {
    const media = {
      id: 1,
      idMal: null,
      title: { romaji: null, english: null },
      genres: [],
      averageScore: null,
      popularity: null,
      episodes: null,
      format: null,
      status: null,
      seasonYear: null,
      siteUrl: null,
      coverImage: { medium: null, large: null },
    };
    const parsed = AnilistMediaSchema.parse(media);
    expect(parsed.title).toEqual({ romaji: null, english: null });
  });

  it('rejects a missing required field', () => {
    const result = AnilistMediaSchema.safeParse({ id: 1 });
    expect(result.success).toBe(false);
  });
});
