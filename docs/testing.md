# Test Policy

Lightweight, enforced through CI. The goal is fast feedback on breakage,
not 100 % coverage theatre.

## Principles

1. **Test behaviour, not implementation.** Render the component, drive
   it like a user (click, type, tab), assert on what the user sees.
   Avoid asserting on internal state, class names, or DOM structure
   that isn't part of the contract.
2. **Tests live next to source.** `Foo.tsx` → `Foo.test.tsx` in the
   same directory. No parallel `__tests__` tree.
3. **Fast by default.** Unit + component tests in jsdom only. Anything
   slower than a few seconds locally is a bug.
4. **Mocks at the boundary.** Mock `fetch` / network at the call site,
   never internal modules. Use the same fixtures the mock API route
   serves (`apps/web/lib/mocks/`).
5. **No flaky tests.** A flaky test is broken — fix or delete.
6. **Snapshots are last resort.** Permitted only for stable, low-churn
   surfaces (design tokens, generated code). Reviewed line-by-line.

## What gets tested

| Layer                          | Required                    | Tool                     |
| ------------------------------ | --------------------------- | ------------------------ |
| `packages/ui` primitives       | Render + a11y attributes    | Vitest + RTL             |
| `packages/ui` composites       | Behaviour (click, focus)    | Vitest + RTL             |
| `apps/web` hooks & utilities   | Pure-function unit tests    | Vitest                   |
| `apps/web` page components     | Smoke render + key flow     | Vitest + RTL             |
| `apps/web` route handlers      | Filter / response logic     | Vitest                   |
| End-to-end user journeys       | Deferred (Playwright later) | —                        |
| Go API (`apps/api`)            | Owned by Go test suite      | `go test`                |

## Coverage targets

Per package, enforced in CI:

- **`packages/ui`** — 80 % lines, 75 % branches.
- **`apps/web`** — 70 % lines, 65 % branches (excludes generated types
  and mock fixtures).

Coverage is a **floor**, not a goal. Sub-threshold PRs fail CI; PRs
that drop coverage on touched files get flagged in review.

Excluded from coverage everywhere:

- `**/*.config.{ts,js,mjs}`
- `**/*.d.ts`
- `**/generated/**`
- `**/mocks/**`
- `**/_components/**/index.ts` (re-exports only)

## Naming & structure

- File: `<source>.test.ts(x)` colocated with `<source>.ts(x)`.
- `describe` block: subject under test (component / function name).
- `it` block: behaviour in plain English — `it("clears all filters when Clear is clicked")`.
- One assertion concept per test; multiple `expect` calls are fine.

## What we don't do

- No tests on third-party libraries (Radix, lucide).
- No tests that re-implement TypeScript's job.
- No unit tests for trivial render-only components without conditional
  logic — covered by integration tests upstream.
- No tests that hit real networks or databases in CI.

## Running locally

```bash
npm test                         # all workspaces
npm test --workspace=@takeaseat/web
npm test -- --watch              # watch mode
npm test -- --coverage           # with coverage report
```

Coverage HTML reports land in `<package>/coverage/index.html`.

## Adding a test

1. Create `Foo.test.tsx` next to `Foo.tsx`.
2. Import from the source path, not the package barrel.
3. Use `screen.getByRole` / `getByLabelText` over `getByTestId`.
4. Run `npm test --workspace=<pkg> -- Foo` to iterate.

## Reviewing a PR

Reviewer checks (in order):

1. Did CI pass? Coverage thresholds met?
2. Are tests testing behaviour, not implementation?
3. Could the test catch a real regression, or is it a tautology?
4. Are mocks at the boundary?

Missing tests on new business logic blocks merge. Missing tests on
trivial render-only components don't.
