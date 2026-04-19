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

// `UserNotFoundError` is raised by the cache layer, not here — AniList returns
// 200 with `MediaListCollection: null` for missing users, so this layer only
// throws on transport / rate-limit / schema failures.
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
      // No explicit cache directive: Next 16's default (no-cache) is what we
      // want — caching lives in our DB layer.
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
      // 4xx other than 429 means we sent a bad request — missing users come
      // back as 200 with a null collection, not as a 404.
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
