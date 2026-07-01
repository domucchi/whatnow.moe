import { describe, expect, it } from 'bun:test';

import {
  emptyPlanningResponse,
  fixtures,
  twoEntryPlanningResponse,
  userNotFoundResponse,
} from '@/testing/fixtures/anilist-responses';

import {
  AnilistErrorResponseSchema,
  AnilistMediaSchema,
  GenreCollectionResponseSchema,
  PlanningListResponseSchema,
} from './schemas';

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

  it('rejects entries without media', () => {
    const result = PlanningListResponseSchema.safeParse({
      data: {
        MediaListCollection: {
          lists: [{ entries: [{}] }],
        },
      },
    });

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

  it('rejects partial media without coverImage', () => {
    const { coverImage, ...media } = fixtures.cowboyBebop;
    const result = AnilistMediaSchema.safeParse(media);

    expect(coverImage).toBeDefined();
    expect(result.success).toBe(false);
  });
});

describe('GenreCollectionResponseSchema', () => {
  it('accepts a genre list', () => {
    const parsed = GenreCollectionResponseSchema.parse({
      data: { GenreCollection: ['Action', 'Drama'] },
    });

    expect(parsed.data.GenreCollection).toEqual(['Action', 'Drama']);
  });

  it('accepts a null genre list', () => {
    const parsed = GenreCollectionResponseSchema.parse({
      data: { GenreCollection: null },
    });

    expect(parsed.data.GenreCollection).toBeNull();
  });
});

describe('AnilistErrorResponseSchema', () => {
  it('accepts errors with optional HTTP status', () => {
    const parsed = AnilistErrorResponseSchema.parse({
      errors: [{ message: 'Not found', status: 404 }, { message: 'Temporarily unavailable' }],
    });

    expect(parsed.errors).toHaveLength(2);
  });
});
