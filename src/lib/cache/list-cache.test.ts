import { beforeEach, describe, expect, it, jest, mock, type Mock } from 'bun:test';

import { UserNotFoundError } from '@/lib/anilist/errors';
import {
  twoEntryPlanningResponse,
  userNotFoundResponse,
} from '@/testing/fixtures/anilist-responses';

await mock.module('@/lib/anilist/client', () => ({
  fetchPlanningList: mock(),
}));
await mock.module('@/lib/db/queries/users', () => ({
  getUserMeta: mock(),
  upsertUser: mock(),
  markUserNotFound: mock(),
}));
await mock.module('@/lib/db/queries/anime', () => ({
  upsertAnimeBatch: mock(),
}));
// Mock the full module shape (not just replaceUserPlanningEntries) so that
// bun's shared module-mock state stays consistent with other test files that
// mock this same path — otherwise an incomplete mock leaks across files.
await mock.module('@/lib/db/queries/matches', () => ({
  getMatches: mock(),
  getMatchStats: mock(),
  replaceUserPlanningEntries: mock(),
}));

// Imported after mock.module so the mocked copies are used.
const { ensureUserListCached } = await import('./list-cache');
const { fetchPlanningList } = await import('@/lib/anilist/client');
const { getUserMeta, upsertUser, markUserNotFound } = await import('@/lib/db/queries/users');
const { upsertAnimeBatch } = await import('@/lib/db/queries/anime');
const { replaceUserPlanningEntries } = await import('@/lib/db/queries/matches');

const mocks = {
  fetchPlanningList: fetchPlanningList as Mock<typeof fetchPlanningList>,
  getUserMeta: getUserMeta as Mock<typeof getUserMeta>,
  upsertUser: upsertUser as Mock<typeof upsertUser>,
  markUserNotFound: markUserNotFound as Mock<typeof markUserNotFound>,
  upsertAnimeBatch: upsertAnimeBatch as Mock<typeof upsertAnimeBatch>,
  replaceUserPlanningEntries: replaceUserPlanningEntries as Mock<typeof replaceUserPlanningEntries>,
};

const oneHour = 60 * 60 * 1000;
const fiveMinutes = 5 * 60 * 1000;

describe('ensureUserListCached', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.upsertUser.mockResolvedValue(42);
  });

  it('returns without fetching when the cache is fresh', async () => {
    mocks.getUserMeta.mockResolvedValue({
      id: 42,
      lastFetchedAt: new Date(Date.now() - oneHour / 2),
      notFound: false,
    });

    await ensureUserListCached('anilist', 'alice');

    expect(mocks.fetchPlanningList).not.toHaveBeenCalled();
    expect(mocks.upsertAnimeBatch).not.toHaveBeenCalled();
    expect(mocks.replaceUserPlanningEntries).not.toHaveBeenCalled();
  });

  it('fetches from AniList when the cache is stale', async () => {
    mocks.getUserMeta.mockResolvedValue({
      id: 42,
      lastFetchedAt: new Date(Date.now() - 2 * oneHour),
      notFound: false,
    });
    mocks.fetchPlanningList.mockResolvedValue(twoEntryPlanningResponse);

    await ensureUserListCached('anilist', 'alice');

    expect(mocks.fetchPlanningList).toHaveBeenCalledWith('alice');
    expect(mocks.upsertAnimeBatch).toHaveBeenCalledTimes(1);
    const animeArg = mocks.upsertAnimeBatch.mock.calls[0]?.[0] ?? [];
    expect(animeArg).toHaveLength(2);
    expect(mocks.upsertUser).toHaveBeenCalledWith('anilist', 'alice');
    expect(mocks.replaceUserPlanningEntries).toHaveBeenCalledWith(42, [1, 154587]);
  });

  it('fetches from AniList when the user has never been seen', async () => {
    mocks.getUserMeta.mockResolvedValue(null);
    mocks.fetchPlanningList.mockResolvedValue(twoEntryPlanningResponse);

    await ensureUserListCached('anilist', 'bob');

    expect(mocks.fetchPlanningList).toHaveBeenCalledWith('bob');
    expect(mocks.replaceUserPlanningEntries).toHaveBeenCalledWith(42, [1, 154587]);
  });

  it('throws UserNotFoundError without hitting AniList when the 404 is fresh', async () => {
    mocks.getUserMeta.mockResolvedValue({
      id: 42,
      lastFetchedAt: new Date(Date.now() - fiveMinutes / 2),
      notFound: true,
    });

    await expect(ensureUserListCached('anilist', 'ghost')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(mocks.fetchPlanningList).not.toHaveBeenCalled();
  });

  it('re-fetches and marks not-found when AniList returns null for the user', async () => {
    mocks.getUserMeta.mockResolvedValue(null);
    mocks.fetchPlanningList.mockResolvedValue(userNotFoundResponse);

    await expect(ensureUserListCached('anilist', 'ghost')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(mocks.markUserNotFound).toHaveBeenCalledWith('anilist', 'ghost');
  });

  it('re-tries AniList after the not-found TTL has expired', async () => {
    mocks.getUserMeta.mockResolvedValue({
      id: 42,
      lastFetchedAt: new Date(Date.now() - fiveMinutes - 1000),
      notFound: true,
    });
    mocks.fetchPlanningList.mockResolvedValue(twoEntryPlanningResponse);

    await ensureUserListCached('anilist', 'ghost');

    expect(mocks.fetchPlanningList).toHaveBeenCalledWith('ghost');
    expect(mocks.markUserNotFound).not.toHaveBeenCalled();
  });
});
