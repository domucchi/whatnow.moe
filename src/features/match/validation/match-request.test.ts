import { describe, expect, it } from 'vitest';

import {
  MatchRequestSchema,
  parseUsernameSegment,
  parseUsernamesFromSearchParams,
} from './match-request';

describe('MatchRequestSchema', () => {
  it('accepts a minimum valid 2-user request', () => {
    const parsed = MatchRequestSchema.parse({ usernames: ['alice', 'bob'] });
    expect(parsed.usernames).toEqual(['alice', 'bob']);
    expect(parsed.onlyFinished).toBe(true);
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
