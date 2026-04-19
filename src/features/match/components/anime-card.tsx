import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AnimeWithMatchInfo } from '@/features/match/types';

import { AvatarStack } from './avatar-stack';
import { MatchRatioPill } from './match-ratio-pill';
import { ScoreBar } from './score-bar';

type Props = {
  anime: AnimeWithMatchInfo;
  rank: number;
  totalUsers: number;
  // All usernames (in original order) so matched indices stay stable across
  // cards. Matched ones come from `anime.matchedUsers`.
  allUsernames: string[];
};

function titleFor(a: AnimeWithMatchInfo): string {
  return a.titleEnglish ?? a.titleRomaji ?? 'Unknown title';
}

function hrefFor(a: AnimeWithMatchInfo): string {
  return a.siteUrl ?? `https://anilist.co/anime/${a.id}`;
}

function formatLabel(a: AnimeWithMatchInfo): string {
  if (a.format === 'MOVIE') return 'Movie';
  if (a.episodes !== null) return `${a.episodes} ep`;
  return a.format ?? '';
}

function matchedEntries(a: AnimeWithMatchInfo, allUsernames: string[]) {
  return a.matchedUsers
    .map((u) => ({ username: u, colorIndex: allUsernames.indexOf(u) }))
    .filter((e) => e.colorIndex >= 0);
}

export function AnimeCard({ anime, rank, totalUsers, allUsernames }: Props) {
  const title = titleFor(anime);
  const href = hrefFor(anime);
  const full = anime.matchCount === totalUsers;
  const entries = matchedEntries(anime, allUsernames);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group animate-fadein flex flex-col outline-none"
    >
      <div className="relative">
        <Poster anime={anime} />

        <div className="font-mono-ui absolute top-2.5 left-2.5 rounded-[4px] bg-black/75 px-[7px] py-[3px] text-[11px] text-[var(--ink-1)] backdrop-blur supports-backdrop-filter:backdrop-blur-sm">
          #{rank}
        </div>

        {full && (
          <div
            className="absolute top-2.5 right-2.5 text-[var(--color-primary)]"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
          >
            <Sparkles className="size-4" />
          </div>
        )}

        <div className="absolute right-2.5 bottom-2.5 left-2.5 flex items-center justify-between">
          <AvatarStack entries={entries} size={22} />
          <MatchRatioPill matched={anime.matchCount} total={totalUsers} />
        </div>

        <div
          className="pointer-events-none absolute inset-0 rounded-[var(--radius)] opacity-0 transition-opacity group-hover:opacity-100"
          style={{ boxShadow: 'inset 0 0 0 2px var(--color-primary)' }}
        />
      </div>

      <div className="px-0.5 pt-2.5">
        <div className="text-foreground line-clamp-2 text-[13.5px] leading-tight font-medium tracking-[-0.005em]">
          {title}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-[var(--ink-3)]">
          {anime.averageScore !== null && (
            <span
              className={cn(
                'font-medium tabular-nums',
                anime.averageScore >= 85 ? 'text-[var(--accent-soft)]' : 'text-[var(--ink-2)]',
              )}
            >
              {anime.averageScore}%
            </span>
          )}
          {anime.seasonYear !== null && (
            <>
              <span className="opacity-40">·</span>
              <span className="tabular-nums">{anime.seasonYear}</span>
            </>
          )}
          {formatLabel(anime) && (
            <>
              <span className="opacity-40">·</span>
              <span>{formatLabel(anime)}</span>
            </>
          )}
        </div>
        {anime.genres.length > 0 && (
          <div className="mt-1 truncate text-[11px] text-[var(--ink-3)]">
            {anime.genres.join(' · ')}
          </div>
        )}
      </div>
    </a>
  );
}

export function AnimeRow({ anime, rank, totalUsers, allUsernames }: Props) {
  const title = titleFor(anime);
  const href = hrefFor(anime);
  const full = anime.matchCount === totalUsers;
  const entries = matchedEntries(anime, allUsernames);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-fadein grid cursor-pointer grid-cols-[34px_50px_1fr_auto_auto_auto] items-center gap-4 rounded-md px-4 py-2.5 transition-colors hover:bg-[var(--bg-1)]"
    >
      <div className="font-mono-ui text-xs text-[var(--ink-3)] tabular-nums">
        {String(rank).padStart(2, '0')}
      </div>
      <div
        className="h-[75px] w-[50px] overflow-hidden rounded-[4px] bg-[var(--bg-2)] bg-cover bg-center"
        style={{
          backgroundImage:
            (anime.coverMedium ?? anime.coverLarge)
              ? `url('${anime.coverMedium ?? anime.coverLarge}')`
              : undefined,
        }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-foreground truncate text-sm font-medium">{title}</div>
          {full && (
            <span className="text-[var(--color-primary)]">
              <Sparkles className="size-3" />
            </span>
          )}
        </div>
        {anime.genres.length > 0 && (
          <div className="mt-1 truncate text-[11.5px] text-[var(--ink-3)]">
            {anime.genres.join(' · ')}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <AvatarStack entries={entries} size={22} />
        <MatchRatioPill matched={anime.matchCount} total={totalUsers} />
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--ink-2)]">
        {anime.seasonYear !== null && <span className="tabular-nums">{anime.seasonYear}</span>}
        {formatLabel(anime) && (
          <>
            <span className="opacity-30">·</span>
            <span>{formatLabel(anime)}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {anime.averageScore !== null && (
          <>
            <ScoreBar value={anime.averageScore} accent={anime.averageScore >= 85} />
            <span
              className={cn(
                'text-xs tabular-nums',
                anime.averageScore >= 85 ? 'text-[var(--accent-soft)]' : 'text-[var(--ink-1)]',
              )}
            >
              {anime.averageScore}
            </span>
          </>
        )}
        <ArrowRight className="size-3.5 text-[var(--ink-3)]" />
      </div>
    </a>
  );
}

function Poster({ anime }: { anime: AnimeWithMatchInfo }) {
  const src = anime.coverLarge ?? anime.coverMedium;
  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--radius)] bg-[var(--bg-2)]"
      style={{ aspectRatio: '2 / 3' }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
        />
      ) : (
        <div className="font-display absolute inset-0 grid place-items-center p-3 text-center text-[28px] leading-[1.05] text-[var(--ink-2)]">
          {(anime.titleEnglish ?? anime.titleRomaji ?? '?').slice(0, 24)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
    </div>
  );
}
