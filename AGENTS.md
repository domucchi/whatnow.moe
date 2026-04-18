<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

Follow principles of [Bulletproof React](https://github.com/alan2207/bulletproof-react) — feature-based modules in `src/features/`, unidirectional imports (shared → features → app), no cross-feature imports, absolute imports via `@/*`, kebab-case filenames and folders, no barrel files.

See `docs/overview.md` for the full architecture and the phase plans (`docs/phase-0-scaffold.md` through `docs/phase-3-polish.md`).
