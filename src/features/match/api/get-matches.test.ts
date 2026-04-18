import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MatchRow } from '@/lib/db/queries/matches';

vi.mock('@/lib/cache/list-cache', () => ({
  ensureUserListCached: vi.fn(),
}));
// Mock the whole matches module so the real one (which imports env + the DB
// client) never loads during tests.
vi.mock('@/lib/db/queries/matches', () => ({
  getMatches: vi.fn(),
  replaceUserPlanningEntries: vi.fn(),
}));

const { getMatches } = await import('./get-matches');
const { ensureUserListCached } = await import('@/lib/cache/list-cache');
const { getMatches: getMatchesFromDb } = await import('@/lib/db/queries/matches');

const mocks = {
  ensureUserListCached: vi.mocked(ensureUserListCached),
  getMatchesFromDb: vi.mocked(getMatchesFromDb),
};

const baseMatchFields: Omit<MatchRow, 'id' | 'matchCount' | 'matchedUsers' | 'titleEnglish'> = {
  malId: null,
  titleRomaji: null,
  genres: [],
  averageScore: null,
  popularity: null,
  episodes: null,
  format: 'TV',
  status: 'FINISHED',
  seasonYear: null,
  siteUrl: null,
  coverMedium: null,
  coverLarge: null,
};

function makeRow(overrides: Partial<MatchRow> & Pick<MatchRow, 'id'>): MatchRow {
  return {
    ...baseMatchFields,
    titleEnglish: `Anime ${overrides.id}`,
    matchCount: 2,
    matchedUsers: ['alice', 'bob'],
    ...overrides,
  };
}

describe('getMatches (orchestrator)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns [] when fewer than 2 users are provided', async () => {
    const result = await getMatches({ users: [{ provider: 'anilist', username: 'alice' }] });
    expect(result).toEqual([]);
    expect(mocks.ensureUserListCached).not.toHaveBeenCalled();
    expect(mocks.getMatchesFromDb).not.toHaveBeenCalled();
  });

  it('caches every user in parallel before running the match query', async () => {
    mocks.getMatchesFromDb.mockResolvedValue([]);

    await getMatches({
      users: [
        { provider: 'anilist', username: 'alice' },
        { provider: 'anilist', username: 'bob' },
        { provider: 'anilist', username: 'charlie' },
      ],
    });

    expect(mocks.ensureUserListCached).toHaveBeenCalledTimes(3);
    expect(mocks.ensureUserListCached).toHaveBeenNthCalledWith(1, 'anilist', 'alice');
    expect(mocks.ensureUserListCached).toHaveBeenNthCalledWith(2, 'anilist', 'bob');
    expect(mocks.ensureUserListCached).toHaveBeenNthCalledWith(3, 'anilist', 'charlie');
  });

  it('passes onlyFinished through to the DB query', async () => {
    mocks.getMatchesFromDb.mockResolvedValue([]);

    await getMatches({
      users: [
        { provider: 'anilist', username: 'alice' },
        { provider: 'anilist', username: 'bob' },
      ],
      onlyFinished: false,
    });

    expect(mocks.getMatchesFromDb).toHaveBeenCalledWith({
      usernames: ['alice', 'bob'],
      onlyFinished: false,
    });
  });

  it('groups DB rows into descending match-count sections', async () => {
    mocks.getMatchesFromDb.mockResolvedValue([
      makeRow({ id: 1, matchCount: 3, matchedUsers: ['alice', 'bob', 'charlie'] }),
      makeRow({ id: 2, matchCount: 3, matchedUsers: ['alice', 'bob', 'charlie'] }),
      makeRow({ id: 3, matchCount: 2, matchedUsers: ['alice', 'bob'] }),
    ]);

    const result = await getMatches({
      users: [
        { provider: 'anilist', username: 'alice' },
        { provider: 'anilist', username: 'bob' },
        { provider: 'anilist', username: 'charlie' },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.matchCount).toBe(3);
    expect(result[0]?.totalInGroup).toBe(2);
    expect(result[1]?.matchCount).toBe(2);
    expect(result[1]?.totalInGroup).toBe(1);
  });

  it('propagates errors from the cache layer', async () => {
    mocks.ensureUserListCached.mockRejectedValueOnce(new Error('boom'));

    await expect(
      getMatches({
        users: [
          { provider: 'anilist', username: 'alice' },
          { provider: 'anilist', username: 'bob' },
        ],
      }),
    ).rejects.toThrow('boom');
  });
});
