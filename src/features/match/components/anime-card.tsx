import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import type { AnimeWithMatchInfo } from '@/features/match/types';

type Props = {
  anime: AnimeWithMatchInfo;
};

/**
 * One anime tile in the results grid. RSC — no interactivity, server-rendered.
 * Styling is intentionally minimal; the design pass in Phase 2 replaces this.
 */
export function AnimeCard({ anime }: Props) {
  const title = anime.titleEnglish ?? anime.titleRomaji ?? 'Unknown title';
  const href = anime.siteUrl ?? `https://anilist.co/anime/${anime.id}`;
  const topGenres = anime.genres.slice(0, 3);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group border-border hover:border-ring bg-card flex flex-col gap-2 rounded-lg border p-3 transition-colors"
    >
      <div className="bg-muted relative aspect-[2/3] w-full overflow-hidden rounded-md">
        {anime.coverLarge ? (
          <Image
            src={anime.coverLarge}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            No cover
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium">{title}</p>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {anime.averageScore !== null && <span>{anime.averageScore}%</span>}
          {anime.seasonYear !== null && <span>{anime.seasonYear}</span>}
          {anime.episodes !== null && <span>{anime.episodes} eps</span>}
        </div>
        {topGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {topGenres.map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        )}
        <ul className="text-muted-foreground flex flex-wrap gap-1 pt-1 text-[10px]">
          {anime.matchedUsers.map((u) => (
            <li key={u} className="bg-muted rounded-full px-2 py-0.5">
              {u}
            </li>
          ))}
        </ul>
      </div>
    </a>
  );
}
