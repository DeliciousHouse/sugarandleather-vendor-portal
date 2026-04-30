# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for the canonical contributor/agent rules. This file highlights the parts most relevant to Claude Code sessions.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript, Prisma 7 on Postgres 16 (Docker Compose locally), Tailwind v4, Vitest + Playwright, Resend for email. Generated Prisma client lives at `src/generated/`.

## Commands

```bash
npm run dev                    # Next dev server on :3000
npm run test                   # Vitest unit + component (NODE_ENV=test)
npm run test:watch             # Vitest watch
npm run test:e2e               # Playwright (needs running dev server)
npm run lint
npm run verify                 # lint + test + build
npm run prisma:validate
npm run prisma:seed            # idempotent for tiers/products; upserts admin
npx prisma migrate dev         # apply migrations
```

Run a single test: `npx vitest run tests/domain/foo.test.ts` (or `-t "name"`).
Run a single Playwright spec: `npx playwright test tests/e2e/foo.spec.ts`.

**Build gotcha:** if `npm run build` fails because `node_modules` is a symlink (git worktree), use `npx next build --webpack`. If the build modifies `next-env.d.ts`, restore it with `git checkout next-env.d.ts` before committing.

**Pre-completion gate (from AGENTS.md):** before marking any task complete, run `npm run prisma:validate && npm run lint && npm run test && npx next build --webpack`.

## Architecture

Strict layering — page components must NOT call Prisma directly:

```
src/app/**/page.tsx            UI only
src/app/**/actions.ts          thin server-action wrappers
src/domain/<module>/service.ts business logic + mutations + Prisma writes
src/domain/<module>/queries.ts read models for pages/tables
src/domain/<module>/schema.ts  Zod validation
src/domain/<module>/types.ts   shared DTOs
src/lib/audit.ts               AuditLog writer
src/styles/tokens.css          brand tokens (colors/fonts) — single source
```

Domain modules: `activity`, `agreements`, `applications`, `audit`, `commissions`, `deals`, `notifications`, `payouts`, `referrals`, `tiers`, `dashboard`.

Top-level app routes split by audience: `src/app/admin`, `src/app/partner`, plus public `apply` / `login`.

### Non-negotiable invariants

- **Every state-changing service method** takes a `SessionUser` actor and writes an `AuditLog` via `src/lib/audit.ts`.
- **Email after DB commit only.** Persist `Notification` + `EmailLog` rows; mark FAILED on throw.
- **Two-layer auth:** middleware enforces route access; services enforce field-level access. Both required.
- **Status transitions** belong in workflow maps (see `docs/status-workflows.md`), not scattered conditionals.
- **Admin tables**: server-side pagination with deterministic ordering.
- **Partner referrals are immutable** post-creation. Corrections are admin notes / admin field edits, each audited. Never give partners an edit path.
- **Partner accounts** become `ACTIVE` only when an admin marks an agreement `SIGNED`. No other code path may set `AccountStatus = ACTIVE`.

### Financial integrity

- Never delete financial history — void with negative `CommissionEvent` records or clawbacks (additive negatives).
- Snapshot commission rule fields at deal close; tier changes must not retroactively alter paid history.
- DB-level guards: `AttributionLock.key @unique` (first-attribution), `PayoutLine.commissionEventId @unique` (no double-pay).
- All financial/legal transitions must be idempotent and retry-safe.

## Schema freeze

`prisma/schema.prisma` and shared service signatures are the contract for parallel workstreams. Do not modify without explicit approval — breaking changes require stopping parallel agents, re-running migrations and seed, and resuming from the updated contract.

## Design system

**Always read `DESIGN.md` before any visual or UI change.** It is the source of truth for typography, color, layout, composition primitives, and the anti-slop checklist. Tokens live in `src/styles/tokens.css`. Do not hardcode hex or font-family names in components. Lavender (`#C5B8D4`) is accent only — max 20% of composition, never a button background, never a status color.

## Testing

- `tests/domain/*.test.ts` — pure TS, mocks/fakes, no DB.
- `tests/components/*.test.tsx` — RTL + jsdom.
- `tests/e2e/*.spec.ts` — Playwright; needs dev server.
- Integration tests use a **real test DB** — do not mock the Prisma client.
- Access-control helpers must cover: admin-allowed, partner-denied-admin, inactive-partner-denied, active-partner-allowed.
- TDD expected for domain helpers and services.
