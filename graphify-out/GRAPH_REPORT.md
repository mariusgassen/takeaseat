# Graph Report - .  (2026-04-18)

## Corpus Check
- 1 files · ~13,380 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 74 nodes · 102 edges · 8 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `Take A Seat — Workspace Reservation System` - 16 edges
2. `Phase 1 Design Spec — Take A Seat` - 16 edges
3. `Monorepo Directory Structure` - 8 edges
4. `REST API Surface (/api/v1/)` - 8 edges
5. `Workflow Orchestration` - 7 edges
6. `Multi-Tenancy with Row-Level Security` - 7 edges
7. `PostgreSQL 18 + PostGIS` - 6 edges
8. `Auth via Zitadel (local, OAuth2, OIDC, SAML)` - 6 edges
9. `CLAUDE.md — Claude Code Instructions` - 5 edges
10. `Zitadel 4 (Self-Hosted Auth)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `CLAUDE.md — Claude Code Instructions` --conceptually_related_to--> `Phase 1 Design Spec — Take A Seat`  [INFERRED]
  CLAUDE.md → docs/superpowers/specs/2026-04-15-phase1-design.md
- `CLAUDE.md — Claude Code Instructions` --semantically_similar_to--> `AGENTS.md — Agent Instructions`  [EXTRACTED] [semantically similar]
  CLAUDE.md → AGENTS.md
- `AGENTS.md — Agent Instructions` --references--> `Take A Seat — Workspace Reservation System`  [EXTRACTED]
  AGENTS.md → CLAUDE.md
- `Take A Seat — Workspace Reservation System` --references--> `Phase 1 Design Spec — Take A Seat`  [EXTRACTED]
  CLAUDE.md → docs/superpowers/specs/2026-04-15-phase1-design.md
- `Zitadel 4 (Self-Hosted Auth)` --references--> `Go API Tenant JWT Middleware`  [EXTRACTED]
  CLAUDE.md → docs/superpowers/specs/2026-04-15-phase1-design.md

## Hyperedges (group relationships)
- **Phase 1 Core Data Model Tables** — spec_db_tenants_table, spec_db_users_table, spec_db_resources_table, spec_db_reservations_table, spec_db_sso_providers_table, spec_db_user_identities_table [EXTRACTED 1.00]
- **API Contract Generation Pipeline** — spec_app_api, tech_openapi, spec_pkg_types, spec_app_web, spec_app_mobile [EXTRACTED 1.00]
- **Real-Time Availability Flow** — spec_db_reservations_table, spec_redis_pubsub_availability, spec_realtime_sse [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (18): Take A Seat — Workspace Reservation System, apps/mobile — Expo Mobile App, apps/web — Next.js Web App, Expo PKCE OAuth2 Flow, Next.js openid-client for OIDC, Build Pipeline: api → openapi → types → web/mobile, Monorepo Directory Structure, packages/types — Generated TS from OpenAPI (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (16): Rationale: Exclusion Constraint for Atomic Conflict Detection, Rationale: Tenant Resolved from JWT Only (Not URL), Cursor-Based Pagination, API Endpoints: Reservations, API Endpoints: Resources, RFC 9457 Problem Details Error Format, REST API Surface (/api/v1/), API Endpoints: Tenant & SSO (admin only) (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (13): AGENTS.md — Agent Instructions, tasks/lessons.md — Lessons Learned File, tasks/todo.md — Task Plan File, CLAUDE.md — Claude Code Instructions, Autonomous Bug Fixing, Caveman Mode Communication Style, Demand Elegance (Balanced), Plan Mode Default (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.28
Nodes (9): Auth via Zitadel (local, OAuth2, OIDC, SAML), DB Table: sso_providers, DB Table: tenants, DB Table: user_identities, Deferred Features: Floor Plan, Notifications, Integrations, Analytics, Phase 1 Design Spec — Take A Seat, Phase 1 Scope: Core Booking Loop Only, Go API Tenant JWT Middleware (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (9): Rationale: SSE Chosen Over WebSocket (HTTP-Native, Proxy-Friendly), apps/api — Go Backend, Go API JWT-Only Validation (No Sessions), Deployment: Docker Compose Services, Real-Time Availability via SSE, Redis Pub/Sub for Availability Fan-Out, Docker Compose (Self-Hosted Deployment), Go 1.26 (Chi 5, sqlc, pgx) (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.4
Nodes (6): graphify-out/graph.json, graphify-out/ — Knowledge Graph Output Directory, graphify-out/wiki/index.md, Obsidian Vault — Code Memory, 3-Layer Query Rule, GRAPH_REPORT.md — Knowledge Graph Summary Report

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (1): Core Principles

## Knowledge Gaps
- **22 isolated node(s):** `Plan Mode Default`, `Subagent Strategy`, `Verification Before Done`, `Demand Elegance (Balanced)`, `Autonomous Bug Fixing` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (2 nodes): `main.go`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (1 nodes): `Core Principles`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 1 Design Spec — Take A Seat` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`?**
  _High betweenness centrality (0.424) - this node is a cross-community bridge._
- **Why does `Take A Seat — Workspace Reservation System` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Why does `CLAUDE.md — Claude Code Instructions` connect `Community 2` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **What connects `Plan Mode Default`, `Subagent Strategy`, `Verification Before Done` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._