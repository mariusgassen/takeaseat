# `@takeaseat/ui`

Shared UI primitives + design tokens for the Take A Seat web client
(and, eventually, mobile shared composites).

[![frontend](https://raw.githubusercontent.com/mariusgassen/takeaseat/badges/frontend.svg)](https://github.com/mariusgassen/takeaseat/actions/workflows/ci.yml)

## What's in the box

| Group        | Components                                                                |
| ------------ | ------------------------------------------------------------------------- |
| Primitives   | `Button`, `Input`, `Label`, `Badge`, `Card*`, `Skeleton`, `Separator`     |
| Overlays     | `Dialog*`, `Popover*`, `DropdownMenu*`, `Tooltip*`                        |
| Inputs       | `ToggleGroup`, `SelectNative`                                             |
| Composites   | `AppShell`, `EmptyState`                                                  |
| Utilities    | `cn(...)` (clsx + tailwind-merge)                                         |

All components are shadcn-style: small wrappers around Radix where
behaviour matters (`Dialog`, `Popover`, `DropdownMenu`, etc.) and plain
React + Tailwind elsewhere. Style is "calm productivity" — soft
shadows, neutral surfaces, single accent (slate-blue).

## Usage

```tsx
import { Button, Card, CardContent, EmptyState, cn } from "@takeaseat/ui";
import "@takeaseat/ui/styles.css"; // tokens; loaded once in app/globals.css
```

## Tokens

CSS variables on `:root` and `.dark` in `src/styles.css`:

- Surfaces: `--color-bg`, `--color-surface`, `--color-surface-muted`
- Foreground: `--color-fg`, `--color-fg-muted`
- Borders: `--color-border`, `--color-border-strong`
- Accent: `--color-accent`, `--color-accent-fg`, `--color-accent-soft`
- Status: `--color-success`, `--color-warning`, `--color-danger`
- Radius: `--radius-sm/md/lg`
- Shadow: `--shadow-sm/md/lg`

Exposed to Tailwind via `@theme` so you can write `bg-surface`,
`text-fg-muted`, `border-border`, etc.

## Tests

```bash
npm test --workspace=@takeaseat/ui
npm run test:coverage --workspace=@takeaseat/ui
```

Threshold: 80 % lines / 75 % branches. Thin Radix wrappers are
excluded from coverage (covered by consumer integration tests in
`apps/web`).

## Adding a component

1. Drop `src/components/<name>.tsx`.
2. Re-export from `src/index.ts`.
3. Add a colocated `<name>.test.tsx` if it has any conditional logic.
   Skip if it's a pure render-only wrapper.
