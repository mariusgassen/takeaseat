# Take A Seat

[![ci](https://github.com/mariusgassen/takeaseat/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mariusgassen/takeaseat/actions/workflows/ci.yml)
[![frontend](https://raw.githubusercontent.com/mariusgassen/takeaseat/badges/frontend.svg)](https://github.com/mariusgassen/takeaseat/actions/workflows/ci.yml)
[![backend](https://raw.githubusercontent.com/mariusgassen/takeaseat/badges/backend.svg)](https://github.com/mariusgassen/takeaseat/actions/workflows/ci.yml)
[![app](https://raw.githubusercontent.com/mariusgassen/takeaseat/badges/app.svg)](https://github.com/mariusgassen/takeaseat/actions/workflows/ci.yml)

Self-hosted workspace reservation system. Book meeting rooms, desks, parking spots, and equipment. Multi-tenant, role-based, SSO-ready.

## Stack

| Layer | Tech |
|-------|------|
| API | Go 1.26, Chi 5, pgx/v5, sqlc 1.30 |
| Auth | Zitadel 4 (self-hosted) — local, OAuth2, OIDC, SAML |
| DB | PostgreSQL 18 + PostGIS, Redis 8 |
| Web | Next.js 16, TypeScript 6, Tailwind CSS v4, shadcn/ui |
| Mobile | Expo SDK 55, NativeWind v5 |
| Monorepo | Turborepo 2.9 |
| Deploy | Docker Compose |

## Structure

```
takeaseat/
├── apps/
│   ├── api/        Go API
│   ├── web/        Next.js web app
│   └── mobile/     Expo mobile app
├── packages/
│   ├── types/      Generated TypeScript types (orval from openapi.yaml)
│   └── ui/         Shared UI components (shadcn/ui)
├── infra/
│   ├── docker-compose.yml
│   └── postgres/   SQL schema + migrations
└── openapi.yaml    API contract (source of truth)
```

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Go 1.26
- Node.js 22+
- npm 10+

### Run locally

```bash
cp .env.example .env
# Edit .env — set passwords and secrets

docker compose up -d
```

Services:
- API: http://localhost:8000
- Web: http://localhost:3000
- Zitadel: http://localhost:8080

### Development

```bash
# API
cd apps/api
go test ./...
go build ./...

# Web / Mobile
npm install
npm run dev --filter=web
npm run dev --filter=mobile
```

## Multi-Tenancy

Single database, row-level security. Each request is scoped to a tenant via the Zitadel JWT org claim (`urn:zitadel:iam:org:id`). PostgreSQL RLS enforces isolation at the DB layer.

## API

REST API at `/api/v1/`. Full contract in [`openapi.yaml`](./openapi.yaml).

- Cursor-based pagination (`?after=<cursor>&limit=N`)
- RFC 9457 Problem Details errors (`application/problem+json`)
- Real-time availability via SSE (`GET /api/v1/resources/availability/stream`)

## Auth

Zitadel handles all auth flows. The Go API validates JWTs only — no session state. Supports:

- Username + password (small teams)
- OAuth2 (Google, Microsoft)
- SAML / OIDC per-tenant IdP (enterprise — Okta, Entra ID)

## Testing

Test policy lives in [`docs/testing.md`](./docs/testing.md). Per-package
runner is Vitest with v8 coverage; thresholds are enforced in CI.

```bash
npm test --workspaces                    # all
npm run test:coverage --workspace=@takeaseat/web
```

CI: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs
typecheck, test, build for the frontend (`@takeaseat/ui` +
`@takeaseat/web`) and `go vet`/`go test` for the backend on every
PR. On `push` to `main` it regenerates the coverage SVG badges
(`frontend`, `backend`, `app`) directly in the workflow and
publishes them to the orphan `badges` branch — no external coverage
service, no secrets.

## License

MIT
