type Props = {
  error: Error;
};

// Branch on `error.name` (not `instanceof`) — custom class fields are stripped
// when typed errors cross the RSC serialization boundary, but `name` survives.
export function MatchResultsError({ error }: Props) {
  const { title, description } = describe(error);

  return (
    <div className="flex w-full flex-col items-center gap-2 py-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
    </div>
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
