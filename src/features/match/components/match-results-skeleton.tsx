import { Skeleton } from '@/components/ui/skeleton';

export function MatchResultsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
      </header>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
