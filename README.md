# whatnow.moe

Compare multiple [AniList](https://anilist.co) users' PLANNING lists and find anime they could watch together.

A rebuild of the legacy PoC at [anilist-match](https://github.com/domucchi/anilist-match): Next.js 16 App Router, Neon Postgres, Drizzle, RSC-first, with caching, shareable URLs, and N-user matching.

## How it works

1. Enter two or more AniList usernames.
2. Their public PLANNING lists are fetched (or served from cache), upserted into Postgres, and intersected.
3. Results are grouped by how many users share each title ("All 3 want to watch · 12 anime", "2 of 3 · 47 anime", …) and sorted by score and popularity.

Public lists only, no OAuth, no private data.

## Tech stack

- **Framework:** Next.js 16 App Router (RSC-first, Server Actions)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind v4 + shadcn/ui primitives (dark theme only)
- **Database:** Neon Postgres + Drizzle ORM
- **Validation:** Zod (shared between client and server)
- **URL state:** nuqs
- **Testing:** Bun test runner
- **Deployment:** Vercel + Neon (branch-per-preview)

See [`docs/overview.md`](./docs/overview.md) for architecture, data model, and the matching SQL.

## Getting started

Requirements: Node.js 20+, bun, a Neon Postgres database.

```bash
bun install
cp .env.example .env.local      # fill in DATABASE_URL and ANILIST_USER_AGENT
bun db:migrate                  # apply committed migrations to the dev branch
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                            | Purpose                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `bun dev`                         | Start the Next.js dev server                                           |
| `bun build`                       | Production build                                                       |
| `bun start`                       | Run the production build                                               |
| `bun lint`                        | ESLint                                                                 |
| `bun typecheck`                   | `tsc --noEmit`                                                         |
| `bun format` / `bun format:check` | Prettier                                                               |
| `bun test` / `bun test:watch`     | Bun test runner                                                        |
| `bun db:generate`                 | Generate a Drizzle migration from the schema, commit the SQL           |
| `bun db:migrate`                  | Apply committed migrations to `DATABASE_URL` (dev branch)              |
| `bun db:migrate:prod`             | Apply committed migrations to `DATABASE_URL_PROD` (prod branch)        |
| `bun db:push`                     | Push schema directly — local prototyping only, not for shared branches |
| `bun db:studio`                   | Open Drizzle Studio                                                    |

## Project conventions

Follows [Bulletproof React](https://github.com/alan2207/bulletproof-react), adapted for the App Router:

- Feature-based modules in `src/features/`
- Unidirectional imports: shared → features → app (enforced by ESLint)
- No cross-feature imports, no barrel files
- Absolute imports via `@/*`
- Kebab-case filenames and folders
- Env vars validated at startup via Zod in `src/config/env.ts`

More detail in [`AGENTS.md`](./AGENTS.md) and [`docs/overview.md`](./docs/overview.md).

## License

[MIT](./LICENSE) © domucchi
