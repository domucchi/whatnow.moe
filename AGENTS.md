# Code style

- Don't write comments that restate what the code does
- Only add comments to explain _why_ something non-obvious was done, or to flag gotchas/workarounds
- No docstrings unless explicitly requested

# Project conventions

Follow principles of [Bulletproof React](https://github.com/alan2207/bulletproof-react) — feature-based modules in `src/features/`, unidirectional imports (shared → features → app), no cross-feature imports, absolute imports via `@/*`, kebab-case filenames and folders, no barrel files.

See `docs/overview.md` for the full architecture and the phase plans (`docs/phase-0-scaffold.md` through `docs/phase-3-polish.md`).
