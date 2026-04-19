// `name` is set via class field (not the constructor) so it survives the RSC
// serialization boundary — class identity does not, but the string `name` does.
export type ListProvider = 'anilist' | 'mal';

export class UserNotFoundError extends Error {
  override readonly name = 'UserNotFoundError';
  readonly provider: ListProvider;
  readonly username: string;

  constructor(provider: ListProvider, username: string) {
    super(`User '${username}' not found on ${provider}`);
    this.provider = provider;
    this.username = username;
  }
}

export class RateLimitError extends Error {
  override readonly name = 'RateLimitError';
  readonly provider: ListProvider;
  readonly retryAfterSeconds: number | null;

  constructor(provider: ListProvider, retryAfterSeconds: number | null) {
    super(`Rate-limited by ${provider}${retryAfterSeconds ? ` for ${retryAfterSeconds}s` : ''}`);
    this.provider = provider;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ProviderDownError extends Error {
  override readonly name = 'ProviderDownError';
  readonly provider: ListProvider;
  readonly status: number | undefined;

  constructor(provider: ListProvider, status?: number) {
    super(`${provider} is unavailable${status ? ` (HTTP ${status})` : ''}`);
    this.provider = provider;
    this.status = status;
  }
}

export class ProviderSchemaError extends Error {
  override readonly name = 'ProviderSchemaError';
  readonly provider: ListProvider;

  constructor(provider: ListProvider, cause: unknown) {
    super(`${provider} response did not match expected schema`);
    this.provider = provider;
    this.cause = cause;
  }
}

// `instanceof` is unreliable across the RSC boundary, so check `name` instead.
export function isKnownProviderError(
  error: unknown,
): error is UserNotFoundError | RateLimitError | ProviderDownError | ProviderSchemaError {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'UserNotFoundError' ||
    error.name === 'RateLimitError' ||
    error.name === 'ProviderDownError' ||
    error.name === 'ProviderSchemaError'
  );
}
