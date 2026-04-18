import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserNotFoundError } from '@/lib/anilist/errors';
import {
  twoEntryPlanningResponse,
  userNotFoundResponse,
} from '@/testing/fixtures/anilist-responses';

vi.mock('@/lib/anilist/client', () => ({
  fetchPlanningList: vi.fn(),
}));
vi.mock('@/lib/db/queries/users', () => ({
  getUserMeta: vi.fn(),
  upsertUser: vi.fn(),
  markUserNotFound: vi.fn(),
}));
vi.mock('@/lib/db/queries/anime', () => ({
  upsertAnimeBatch: vi.fn(),
}));
vi.mock('@/lib/db/queries/matches', () => ({
  replaceUserPlanningEntries: vi.fn(),
}));

// Imported after vi.mock so the mocked copies are used.
const { ensureUserListCached } = await import('./list-cache');
const { fetchPlanningList } = await import('@/lib/anilist/client');
const { getUserMeta, upsertUser, markUserNotFound } = await import('@/lib/db/queries/users');
const { upsertAnimeBatch } = await import('@/lib/db/queries/anime');
const { replaceUserPlanningEntries } = await import('@/lib/db/queries/matches');

const mocks = {
  fetchPlanningList: vi.mocked(fetchPlanningList),
  getUserMeta: vi.mocked(getUserMeta),
  upsertUser: vi.mocked(upsertUser),
  markUserNotFound: vi.mocked(markUserNotFound),
  upsertAnimeBatch: vi.mocked(upsertAnimeBatch),
  replaceUserPlanningEntries: vi.mocked(replaceUserPlanningEntries),
};

const oneHour = 60 * 60 * 1000;
const fiveMinutes = 5 * 60 * 1000;

describe('ensureUserListCached', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(mocks.upsertAnimeBatch).toHaveBeenCalledOnce();
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
