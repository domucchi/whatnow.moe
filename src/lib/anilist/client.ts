import { z } from 'zod';

import { env } from '@/config/env';

import { ProviderDownError, ProviderSchemaError, RateLimitError } from './errors';
import { PLANNING_LIST_QUERY } from './queries';
import { PlanningListResponseSchema, type PlanningListResponse } from './schemas';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';
const MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 500;

type AnilistFetchOptions = {
  retries?: number;
  signal?: AbortSignal;
};

/**
 * Thin typed wrapper around AniList's single GraphQL endpoint.
 *
 * Responsibilities:
 * - POSTs the query + variables with our User-Agent
 * - Retries 429 (respecting Retry-After when present) and 5xx with backoff
 * - Validates the response via Zod and throws `ProviderSchemaError` on mismatch
 *
 * It deliberately does NOT know about users, the cache, or the DB — those
 * concerns live in `src/lib/cache/list-cache.ts` and above.
 *
 * Note: this module throws `RateLimitError` / `ProviderDownError` / `ProviderSchemaError`.
 * `UserNotFoundError` is raised one layer up (when `MediaListCollection` is null)
 * because "user not found" is a successful GraphQL response from AniList's point
 * of view and only becomes an error at our cache layer.
 */
export async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>,
  options: AnilistFetchOptions = {},
): Promise<T> {
  const maxRetries = options.retries ?? MAX_RETRIES;

  let attempt = 0;
  for (;;) {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': env.ANILIST_USER_AGENT,
      },
      body: JSON.stringify({ query, variables }),
      signal: options.signal,
      // fetch defaults to no-cache in Next 16 which is what we want —
      // caching lives in our DB layer, not here.
    });

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
      if (attempt < maxRetries) {
        await sleep(retryAfter ?? backoffMs(attempt));
        attempt++;
        continue;
      }
      throw new RateLimitError('anilist', retryAfter);
    }

    if (response.status >= 500 && response.status < 600) {
      if (attempt < maxRetries) {
        await sleep(backoffMs(attempt));
        attempt++;
        continue;
      }
      throw new ProviderDownError('anilist', response.status);
    }

    if (!response.ok) {
      // 4xx other than 429. AniList returns 404 for missing user lists
      // wrapped as a schema-level null, not an HTTP status — so this is
      // really just "we did something wrong".
      throw new ProviderDownError('anilist', response.status);
    }

    const json: unknown = await response.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ProviderSchemaError('anilist', parsed.error);
    }
    return parsed.data;
  }
}

/**
 * Convenience wrapper for the one query we care about in Phase 1.
 * Returns the raw parsed response; callers handle the null case
 * (= user not found) themselves.
 */
export async function fetchPlanningList(
  username: string,
  options?: AnilistFetchOptions,
): Promise<PlanningListResponse> {
  return anilistFetch(
    PLANNING_LIST_QUERY,
    { userName: username },
    PlanningListResponseSchema,
    options,
  );
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  return null;
}

function backoffMs(attempt: number): number {
  return DEFAULT_BACKOFF_MS * 2 ** attempt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
