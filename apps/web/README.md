# `@takeaseat/web`

Next.js 15 App Router web client for Take A Seat. Workspace booking
UI: search resources, book rooms / desks / parking / equipment.

[![web-ci](https://github.com/mariusgassen/takeaseat/actions/workflows/web-ci.yml/badge.svg?branch=main)](https://github.com/mariusgassen/takeaseat/actions/workflows/web-ci.yml)
[![coverage – web](https://codecov.io/gh/mariusgassen/takeaseat/branch/main/graph/badge.svg?flag=web)](https://codecov.io/gh/mariusgassen/takeaseat?flags%5B0%5D=web)

## Quick start

From the repo root:

```bash
npm install
npm run dev --workspace=@takeaseat/web
# → http://localhost:3000
```

The app is fully demoable with no backend running — `/api/mock/resources`
serves fixtures from `lib/mocks/resources.ts`. The mock auth flow lives
on a client cookie; click "Continue as demo user" on `/login`.

## Stack

- **Framework**: Next.js 15 (App Router, Server Components, Turbopack dev).
- **Language**: TypeScript (strict, `noUncheckedIndexedAccess`).
- **Styling**: Tailwind CSS v4 (CSS-first config) + design tokens from
  [`@takeaseat/ui`](../../packages/ui/README.md).
- **UI primitives**: shadcn-style wrappers around Radix in
  `@takeaseat/ui`.
- **Theme**: `next-themes` (light / dark / system).
- **Icons**: `lucide-react`.
- **Auth (today)**: client-cookie mock context. Real Zitadel OIDC lands
  in a follow-up.
- **Tests**: Vitest + React Testing Library (jsdom).

## Project layout

```
apps/web/
├── app/
│   ├── (auth)/
│   │   └── login/                 # mock login screen
│   ├── (app)/                     # gated routes (require mock cookie)
│   │   ├── _components/
│   │   │   ├── auth-gate.tsx      # client-side redirect to /login
│   │   │   ├── sidebar.tsx        # nav, role-gated admin link
│   │   │   └── topbar.tsx         # workspace switcher + theme + user menu
│   │   ├── search/                # resource search & booking (primary feature)
│   │   │   ├── _components/
│   │   │   │   ├── filter-bar.tsx
│   │   │   │   ├── resource-card.tsx
│   │   │   │   ├── results-grid.tsx
│   │   │   │   ├── book-dialog.tsx
│   │   │   │   └── type-meta.ts
│   │   │   └── page.tsx
│   │   ├── reservations/page.tsx  # placeholder
│   │   ├── favorites/page.tsx     # placeholder
│   │   └── layout.tsx             # AppShell + AuthGate
│   ├── api/mock/resources/        # local route handler over fixtures
│   ├── globals.css                # Tailwind import + tokens
│   ├── layout.tsx                 # RootLayout, fonts, providers
│   ├── providers.tsx              # ThemeProvider + AuthProvider + TooltipProvider
│   └── page.tsx                   # → redirects to /search
├── lib/
│   ├── api/
│   │   ├── resources.ts           # client fetch + query string builder
│   │   └── types.ts               # local mirror of OpenAPI Resource (until orval)
│   ├── auth/mock-auth.tsx         # cookie-backed AuthProvider/useAuth
│   ├── hooks/use-search-filters.ts # URL ↔ filters
│   └── mocks/resources.ts         # ~30 fixture resources
├── test/setup.ts                  # jest-dom matchers
├── vitest.config.ts
├── next.config.ts
└── tsconfig.json
```

## Common tasks

```bash
# Dev
npm run dev --workspace=@takeaseat/web

# Type check
npm run typecheck --workspace=@takeaseat/web

# Lint
npm run lint --workspace=@takeaseat/web

# Tests (watch / one-shot / coverage)
npm run test:watch --workspace=@takeaseat/web
npm test --workspace=@takeaseat/web
npm run test:coverage --workspace=@takeaseat/web
# Coverage HTML → apps/web/coverage/index.html

# Production build
npm run build --workspace=@takeaseat/web
npm start --workspace=@takeaseat/web
```

## Routing

App Router with two route groups:

| Group   | Route             | Purpose                                          |
| ------- | ----------------- | ------------------------------------------------ |
| `(auth)`| `/login`          | Mock sign-in                                     |
| `(app)` | `/search`         | Resource search & filter (primary screen)        |
| `(app)` | `/reservations`   | List bookings (placeholder)                      |
| `(app)` | `/favorites`      | Starred resources (placeholder)                  |

`(app)/layout.tsx` wraps all gated routes in `AuthGate`, which
redirects unauthenticated visitors to `/login`. `typedRoutes` is on, so
all `<Link href>` strings are statically validated.

## Filters & URL state

`useSearchFilters()` (`lib/hooks/use-search-filters.ts`) is the single
source of truth for the search screen's filter state. It:

- Parses `URLSearchParams` into a typed `ResourceSearchFilters`.
- Validates the `type` enum and ignores unknown values.
- Returns `{ filters, update, reset }`.
- Writes back via `router.replace(..., { scroll: false })` so filters
  are shareable and survive a refresh — but no scroll jump on update.

Calling code never reads `useSearchParams` directly.

## API layer

`lib/api/resources.ts` exposes `searchResources(filters)` — a typed
`fetch` wrapper that hits `/api/mock/resources` today. When the Go API
is ready and `@takeaseat/types` is generated by orval, switch the URL
and the local `types.ts` import is replaced by the generated
`@takeaseat/types`.

## Design system

Components live in [`@takeaseat/ui`](../../packages/ui). Tokens are CSS
variables on `:root` and `.dark` (in `packages/ui/src/styles.css`),
exposed to Tailwind via `@theme inline`. To add a new shared
component, put it in `packages/ui/src/components/` and re-export from
`packages/ui/src/index.ts`.

## Testing

Follow [`docs/testing.md`](../../docs/testing.md). In short:

- Vitest + RTL, jsdom environment.
- `Foo.test.tsx` colocated next to `Foo.tsx`.
- Mock at the boundary (`fetch`, `next/navigation`) — never internal
  modules.
- Coverage threshold: 70 % lines / 65 % branches enforced in CI.

## Adding a feature

1. **API**: add the call to `lib/api/<resource>.ts`. Use
   `@takeaseat/types` once generated; until then, mirror the schema in
   `lib/api/types.ts`.
2. **State**: if the screen needs URL-driven state, add a hook next to
   the existing one in `lib/hooks/`.
3. **UI**: scaffold the route under `app/(app)/<name>/`. Keep
   page-specific pieces in `_components/` (Next.js prefix excludes them
   from routing).
4. **Tests**: smoke + behaviour tests for the new components and any
   non-trivial logic.
5. **Mocks**: extend `lib/mocks/` and the matching route handler under
   `app/api/mock/` so the screen is demoable without the Go API.

## Follow-ups (not in this app yet)

- Real Zitadel OIDC sign-in.
- `@takeaseat/types` from orval; drop local `lib/api/types.ts`.
- Real `GET /api/v1/resources` (drop the mock route).
- SSE subscription for live availability.
- Reservations create / list / cancel screens.
- Floor-plan visualisation.
