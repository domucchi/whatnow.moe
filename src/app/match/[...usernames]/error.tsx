'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';

type Props = {
  error: Error & { digest?: string };
  // Next 16 renamed `reset` to `unstable_retry` in the error boundary API.
  unstable_retry: () => void;
};

// Branch on `error.name` (not `instanceof`) — custom class fields are stripped
// when typed errors cross the RSC serialization boundary, but `name` survives.
export default function MatchError({ error, unstable_retry }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const { title, description } = describe(error);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <div className="flex gap-2">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to home
        </Link>
      </div>
    </main>
  );
}

function describe(error: Error): { title: string; description: string } {
  switch (error.name) {
    case 'UserNotFoundError':
      return {
        title: 'User not found',
        description:
          error.message ||
          'One of the AniList usernames could not be found. Double-check the spelling and try again.',
      };
    case 'RateLimitError':
      return {
        title: 'Rate limited',
        description: 'AniList is rate-limiting us. Please try again in a minute.',
      };
    case 'ProviderDownError':
      return {
        title: 'AniList is unavailable',
        description: 'AniList returned an error. Please try again in a few moments.',
      };
    case 'ProviderSchemaError':
      return {
        title: 'Unexpected response',
        description:
          'The response from AniList looked different than expected. This is usually temporary.',
      };
    default:
      return {
        title: 'Something went wrong',
        description: error.message || 'An unexpected error occurred.',
      };
  }
}
