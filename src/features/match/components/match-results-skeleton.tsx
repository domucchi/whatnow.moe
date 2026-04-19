export function MatchResultsSkeleton() {
  return (
    <div className="p-8">
      <div
        className="grid gap-7"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse-soft flex flex-col gap-2.5"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div
              className="w-full rounded-[var(--radius)] bg-[var(--bg-1)]"
              style={{ aspectRatio: '2 / 3' }}
            />
            <div className="h-3 w-3/4 rounded-sm bg-[var(--bg-1)]" />
            <div className="h-2.5 w-2/5 rounded-sm bg-[var(--bg-1)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
