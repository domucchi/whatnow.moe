# Phase 2 design mapping

How the Claude Design handoff (`anilist-match.html` + `src/*.jsx` in the
bundle) maps onto this repo.

## Palette

Design token → shadcn variable. Wired in `src/app/globals.css`.

| design                   | shadcn                                                       | value                                                                          |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `--bg-0`                 | `--background`                                               | `#151311`                                                                      |
| `--bg-1`                 | `--card`, `--popover`, `--sidebar`                           | `#1c1915`                                                                      |
| `--bg-2`                 | `--muted`, `--secondary`, `--sidebar-accent`                 | `#26221c`                                                                      |
| `--bg-3`                 | `--accent`                                                   | `#322d26`                                                                      |
| `--line`                 | `--border`                                                   | `#3a342c`                                                                      |
| `--line-soft`            | `--input`, `--sidebar-border`                                | `#2a251f`                                                                      |
| `--ink-0`                | `--foreground`, `--card-foreground`, `--popover-foreground`  | `#f4ede0`                                                                      |
| `--ink-1`                | — (used directly via `var(--ink-1)`)                         | `#d6cfc0`                                                                      |
| `--ink-2`                | `--muted-foreground`                                         | `#aaa39a` (bumped from `#9a9287` for AA contrast)                              |
| `--ink-3`                | — (used directly via `var(--ink-3)`)                         | `#6b655c`                                                                      |
| coral accent             | `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring` | `#ff6a4d`                                                                      |
| `--accent-soft`          | —                                                            | `#ff8b73`                                                                      |
| `--accent-dim`           | —                                                            | `rgba(255,106,77,0.14)`                                                        |
| user palette (secondary) | —                                                            | `#7db8d6` sky, `#7ec8a0` mint, `#b09bd8` lilac, `#e8b861` gold, `#e08aa0` rose |

App is dark-only; both `:root` and `.dark` carry the same values so shadcn
primitives that gate on `.dark` keep working.

## Typography

Loaded via `next/font/google` in `src/app/layout.tsx` and exposed as CSS
variables mapped into the Tailwind v4 `@theme inline` block:

- `--font-display` → `M PLUS Rounded 1c` (400/500/700/800/900) — body headlines,
  brand mark, stat tile numerals. Exposed as `font-display` utility.
- `--font-ui` → `Zen Kaku Gothic New` (400/500/700/900) — body copy. Aliased to
  `--font-sans` so shadcn's `font-sans` still lands on it.
- `--font-geist-mono` → `Geist Mono` — rank chips, per-row index numbers.
- `--font-heading` → `--font-display` — used by shadcn's `font-heading`.

`body` gets `font-feature-settings: 'ss01', 'cv11'` for the display-font
alternates that the design file uses.

## Global chrome

- `.grain` class on `<body>` renders the SVG-noise overlay from the design
  file (3.5% opacity, `mix-blend-mode: overlay`).
- Scrollbars restyled to match (`bg-3` thumb on transparent track).
- Keyframes `fadein`, `pop`, `pulse-soft`, `spin-slow`, `slide-up` live in
  `globals.css` `@layer utilities`; corresponding `.animate-*` utilities
  are available.

## Layout

Two-pane shell (desktop):

```
┌─ MatchSidebar (320px) ─┬─ <main> ──────────────────────────┐
│ Brand                   │ FilterBar (sticky)              │
│ User chips              │   count · sort · format · … · view │
│ Match-mode toggle (3+)  ├──────────────────────────────────┤
│ Overlap stats (started) │ Grid / list of AnimeCard        │
│ Find / Random / Reset   │                                  │
└─────────────────────────┴──────────────────────────────────┘
```

On `<lg` the sidebar stacks above the main column and the filter button opens
a `<Sheet>` with `FilterPanel` inside, instead of the inline panel.

## Component mapping

Each new React component in `src/features/match/components/` maps to a block
from the design prototype:

| design source                      | repo component                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `sidebar.jsx` (`Sidebar`)          | `match-sidebar.tsx`                                                                |
| `sidebar.jsx` (`UserChip`)         | `user-chip.tsx`                                                                    |
| `sidebar.jsx` (`MatchModeToggle`)  | `match-mode-toggle.tsx`                                                            |
| `sidebar.jsx` (`Stat`)             | `stat-tile.tsx`                                                                    |
| `ui.jsx` (`Avatar`, `AvatarStack`) | `avatar.tsx`, `avatar-stack.tsx`                                                   |
| `ui.jsx` (`ScoreBar`)              | `score-bar.tsx`                                                                    |
| `results.jsx` (`Toolbar`)          | `filter-bar.tsx` + `sort-dropdown.tsx` + `format-dropdown.tsx` + `view-toggle.tsx` |
| `results.jsx` (expandable filters) | `filter-panel.tsx`                                                                 |
| `results.jsx` (`AnimeCard`)        | `anime-card.tsx` (`AnimeCard`)                                                     |
| `results.jsx` (`AnimeRow`)         | `anime-card.tsx` (`AnimeRow`)                                                      |
| `results.jsx` (`MatchRatio`)       | `match-ratio-pill.tsx`                                                             |
| `results.jsx` (`EmptyState`)       | `match-empty-states.tsx`                                                           |
| `random.jsx` (`RandomModal`)       | `random-pick-dialog.tsx` + `random-pick-button.tsx`                                |

Icons: replaced the prototype's hand-rolled `icons.jsx` with `lucide-react`
equivalents (`Plus`, `X`, `Check`, `Users`, `ArrowRight`, `Shuffle`,
`SlidersHorizontal`, `Dice6`, `Sparkles`, `RefreshCw`, `LayoutGrid`, `List`,
`Tv`, `ChevronDown`, `ArrowDownUp`, `Play`).

## Deviations from the prototype

- **"matcha."** brand copy → **"whatnow.moe"** (keeps the `ま` glyph on coral).
- **Sort options** widened from the prototype's 6 to 7: added `matches` (the
  Phase 1 default) as the first entry so the `getMatches` default isn't
  surprising.
- **Format filter** is multi-select (doc requirement) rather than the
  prototype's single "all / TV / Movie / ONA" dropdown.
- **Year range** and **include-airing** controls added (doc requirement) — the
  prototype omits both; they live in the expandable `FilterPanel`.
- **Grain overlay** opacity kept at 3.5% (design value); bump `--ink-2` from
  `#9a9287` to `#aaa39a` for AA contrast on the very dark `--bg-0`.

## Reused primitives

All from `@/components/ui/` (shadcn):

- `Button` (with `buttonVariants` for link-rendered CTAs)
- `Sheet` (mobile filter drawer)
- `DropdownMenu` + `DropdownMenuRadioGroup` + `DropdownMenuCheckboxItem`
- `Slider` (score + year range)
- `Switch` (include airing)
- `Dialog` from `@base-ui/react/dialog` directly — the random-pick modal is
  a center-anchored dialog, not a side sheet.
