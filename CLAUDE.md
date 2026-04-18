# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Style: CAVEMAN MODE

/re

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how


## Task Management

1. Plan First: Write plan to `tasks/todo.md` with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review section to `tasks/todo.md`
6. Capture Lessons: Update `tasks/lessons.md` after corrections


## Core Principles

- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Only touch what's necessary. No side effects with new bugs.

## Context Navigation (Graphify)

### 3-Layer Query Rule
1. **First:** query `graphify-out/graph.json` or `graphify-out/wiki/index.md`
   to understand code structure and connections
2. **Second:** query the Obsidian vault for decisions, progress, and project context
3. **Third:** only read raw code files when editing
   or when the first two layers don't have the answer

### When to rebuild the graph
- After structural changes (new modules, major refactors)
- Command: `graphify . --update` (only processes modified files)
- The graph is persistent — NO need to rebuild every session

### Do NOT
- Don't manually modify files inside `graphify-out/`
- Don't re-read the entire codebase if the graph already has the information

## Project overview

### Take A Seat — Self-Hosted Workspace Reservation System

**Core:** Multi-tenant reservation platform for shared office spaces, meeting rooms, hot desks, and parking. Web + mobile. Self-hosted.

### Features

#### Core
- [ ] Multi-tenant with full tenant isolation
- [ ] Resource types: meeting rooms, desks, parking spots, equipment
- [ ] Booking with conflict detection
- [ ] Recurring reservations (daily, weekly, custom)
- [ ] Availability calendar with floor plan view
- [ ] User roles: admin, manager, member, guest

#### UX
- [ ] Floor plan / map visualization
- [ ] Quick book from calendar
- [ ] Search + filter resources by amenities, capacity, floor
- [ ] Favorites / frequently used resources
- [ ] Waitlist for popular slots
- [ ] Buffer time between bookings
- [ ] Check-in / check-out (no-show detection)

#### Notifications
- [ ] Email confirmations and reminders
- [ ] Cancellation notifications
- [ ] Waitlist alerts
- [ ] Push notifications (PWA)

#### Integrations
- [ ] Calendar sync (Google Calendar, Outlook, iCal)
- [ ] SSO/OIDC (enterprise auth)
- [ ] Room display / digital signage API
- [ ] Webhooks for external systems

#### Admin & Analytics
- [ ] Occupancy dashboards
- [ ] Resource utilization reports
- [ ] Tenant management
- [ ] Audit logging
- [ ] Usage-based billing (optional)

### Tech Stack
- **Web:** Next.js 16 (App Router), TypeScript 6, Tailwind CSS v4.2, shadcn/ui
- **Mobile:** Expo SDK 55, NativeWind v5
- **Backend:** Go 1.26 (Chi router 5, sqlc 1.30, pgx)
- **API contract:** OpenAPI 3 spec → orval → generated TS clients
- **Auth:** Zitadel 4 (self-hosted) — local, OAuth2, OIDC, SAML
- **DB:** PostgreSQL 18 + PostGIS; Redis 8 (pub/sub)
- **Monorepo:** Turborepo 2.9
- **Deployment:** Docker Compose (self-hosted)

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current

## Obsidian Vault

Vault: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Code Memory/`

- **Project notes:** `…/Code Memory/takeaseat/`
- **Graphify notes:** `…/Code Memory/graphify/takeaseat/`

On `/resume`: read the 3 most recent files in `…/takeaseat/logs/` (sort by filename).
