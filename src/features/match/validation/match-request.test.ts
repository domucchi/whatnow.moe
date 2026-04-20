import { describe, expect, it } from 'bun:test';

import {
  MatchRequestSchema,
  parseFiltersFromSearchParams,
  parseUsernameSegment,
  parseUsernamesFromSearchParams,
} from './match-request';

describe('MatchRequestSchema', () => {
  it('accepts a minimum valid 2-user request', () => {
    const parsed = MatchRequestSchema.parse({ usernames: ['alice', 'bob'] });
    expect(parsed.usernames).toEqual(['alice', 'bob']);
    expect(parsed.includeAiring).toBe(false);
    expect(parsed.sort).toBe('matches');
    expect(parsed.mode).toBe('any');
    expect(parsed.view).toBe('grid');
  });

  it('lowercases and dedupes usernames', () => {
    const parsed = MatchRequestSchema.parse({ usernames: ['Alice', 'ALICE', 'bob'] });
    expect(parsed.usernames).toEqual(['alice', 'bob']);
  });

  it('rejects fewer than 2 distinct users after dedupe', () => {
    const result = MatchRequestSchema.safeParse({ usernames: ['alice', 'ALICE'] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 10 usernames', () => {
    const usernames = Array.from({ length: 11 }, (_, i) => `user${i}`);
    const result = MatchRequestSchema.safeParse({ usernames });
    expect(result.success).toBe(false);
  });

  it('rejects usernames with bad characters', () => {
    const result = MatchRequestSchema.safeParse({ usernames: ['alice', 'bob!'] });
    expect(result.success).toBe(false);
  });

  it('trims surrounding whitespace before validation', () => {
    const parsed = MatchRequestSchema.parse({ usernames: [' alice ', 'bob '] });
    expect(parsed.usernames).toEqual(['alice', 'bob']);
  });
});

describe('parseUsernameSegment', () => {
  it('treats a bare name as an AniList username', () => {
    expect(parseUsernameSegment('alice')).toEqual({ provider: 'anilist', username: 'alice' });
  });

  it('respects an explicit anilist: prefix', () => {
    expect(parseUsernameSegment('anilist:alice')).toEqual({
      provider: 'anilist',
      username: 'alice',
    });
  });

  it('routes a mal: prefix to the MAL provider', () => {
    expect(parseUsernameSegment('mal:alice')).toEqual({ provider: 'mal', username: 'alice' });
  });

  it('treats an unknown prefix as part of the AniList username', () => {
    expect(parseUsernameSegment('foo:alice')).toEqual({
      provider: 'anilist',
      username: 'foo:alice',
    });
  });

  it('lowercases the username', () => {
    expect(parseUsernameSegment('Alice')).toEqual({ provider: 'anilist', username: 'alice' });
  });
});

describe('parseUsernamesFromSearchParams', () => {
  it('returns [] when no `u` param is present', () => {
    expect(parseUsernamesFromSearchParams({})).toEqual([]);
  });

  it('handles a single `u` value (string, not array)', () => {
    expect(parseUsernamesFromSearchParams({ u: 'alice' })).toEqual([
      { provider: 'anilist', username: 'alice' },
    ]);
  });

  it('handles multiple `u` values (repeated query param)', () => {
    expect(parseUsernamesFromSearchParams({ u: ['alice', 'bob'] })).toEqual([
      { provider: 'anilist', username: 'alice' },
      { provider: 'anilist', username: 'bob' },
    ]);
  });

  it('delegates provider parsing to parseUsernameSegment', () => {
    expect(parseUsernamesFromSearchParams({ u: ['anilist:alice', 'mal:bob'] })).toEqual([
      { provider: 'anilist', username: 'alice' },
      { provider: 'mal', username: 'bob' },
    ]);
  });

  it('trims whitespace and drops empty entries', () => {
    expect(parseUsernamesFromSearchParams({ u: ['  alice ', '', '  ', 'bob'] })).toEqual([
      { provider: 'anilist', username: 'alice' },
      { provider: 'anilist', username: 'bob' },
    ]);
  });

  it('ignores unrelated params', () => {
    expect(parseUsernamesFromSearchParams({ u: 'alice', sort: 'score' })).toEqual([
      { provider: 'anilist', username: 'alice' },
    ]);
  });
});

describe('parseFiltersFromSearchParams', () => {
  it('returns schema defaults when no filter params are present', () => {
    expect(parseFiltersFromSearchParams({})).toEqual({
      genres: undefined,
      formats: undefined,
      yearMin: undefined,
      yearMax: undefined,
      scoreMin: undefined,
      scoreMax: undefined,
      includeAiring: false,
      sort: 'matches',
      mode: 'any',
      view: 'grid',
    });
  });

  it('parses repeated genre params into an array', () => {
    expect(parseFiltersFromSearchParams({ genre: ['Action', 'Mecha'] }).genres).toEqual([
      'Action',
      'Mecha',
    ]);
  });

  it('drops unknown format values', () => {
    expect(parseFiltersFromSearchParams({ format: ['TV', 'BOGUS', 'MOVIE'] }).formats).toEqual([
      'TV',
      'MOVIE',
    ]);
  });

  it('rejects out-of-range year / score values', () => {
    const filters = parseFiltersFromSearchParams({
      yearMin: '1800',
      yearMax: '9999',
      scoreMin: '-5',
      scoreMax: '200',
    });
    expect(filters.yearMin).toBeUndefined();
    expect(filters.yearMax).toBeUndefined();
    expect(filters.scoreMin).toBeUndefined();
    expect(filters.scoreMax).toBeUndefined();
  });

  it('coerces boolean includeAiring from 1/true', () => {
    expect(parseFiltersFromSearchParams({ includeAiring: 'true' }).includeAiring).toBe(true);
    expect(parseFiltersFromSearchParams({ includeAiring: '1' }).includeAiring).toBe(true);
    expect(parseFiltersFromSearchParams({ includeAiring: 'false' }).includeAiring).toBe(false);
    expect(parseFiltersFromSearchParams({}).includeAiring).toBe(false);
  });

  it('defaults sort / mode / view when the param is garbage', () => {
    const filters = parseFiltersFromSearchParams({
      sort: 'bogus',
      mode: 'bogus',
      view: 'bogus',
    });
    expect(filters.sort).toBe('matches');
    expect(filters.mode).toBe('any');
    expect(filters.view).toBe('grid');
  });
});
