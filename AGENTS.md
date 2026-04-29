# AGENTS.md — Sugar & Leather Vendor Portal

This file governs parallel and sequential agents working in this repo.

## Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Run unit/component tests (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E (requires dev server or CI) |
| `npm run verify` | lint + test + build |
| `npm run prisma:validate` | Validate Prisma schema |
| `npm run prisma:seed` | Seed default data |
| `npx prisma migrate dev` | Apply schema migrations |

## Architecture Rules

1. Server actions in `src/app/**/actions.ts` are thin wrappers — business logic lives in `src/domain/<module>/service.ts`.
2. Prisma queries stay in `src/domain/<module>/service.ts` and `src/domain/<module>/queries.ts`. Do NOT query Prisma in page components.
3. Every state-changing service method accepts a `SessionUser` actor and writes an `AuditLog` entry via `src/lib/audit.ts`.
4. Email is sent AFTER DB commit. Log `Notification` and `EmailLog` records. Mark send as FAILED if it throws.
5. All admin tables use server-side pagination with deterministic ordering.
6. All financial and legal transitions must be idempotent and retry-safe.
7. Middleware enforces route-level access. Services enforce field-level access. Both layers are required.
8. Status transitions live in workflow maps, not scattered conditionals.

## Brand Rules

- **Primary surface**: Obsidian `#0E0C0F` background, Cream `#EDE8E1` text.
- **Panels**: Charcoal `#2C2830`, hover Deep Plum `#3D3347`.
- **Accent**: Lavender `#C5B8D4` — max 20% of composition. NOT used alone for success/error.
- **Body text on dark**: Silver `#A8A5AE`. **Body text on light**: Mid Gray `#6B6570`.
- **Dividers/borders**: Mist `#D8D3DE` (light), `rgba(237,232,225,0.12)` (dark).
- **Headings**: Cormorant Garamond (variable `--font-heading`).
- **Body**: Inter (variable `--font-body`).
- **Code/technical**: Courier Prime (variable `--font-mono`).
- All tokens are in `src/styles/tokens.css`. Do NOT hardcode hex values in components.
- Logo: use Cream logo on dark, Obsidian logo on light. Never stretch, rotate, or add effects.

## Testing Rules

- Write tests BEFORE or WITH implementation (TDD for domain helpers and services).
- Unit tests: `tests/domain/*.test.ts` — pure TS, no DB required, use mocks/fakes.
- Component tests: `tests/components/*.test.tsx` — React Testing Library + jsdom.
- E2E tests: `tests/e2e/*.spec.ts` — Playwright, requires running dev server.
- Run `npm run test` before marking any task complete.
- Do NOT mock the Prisma client for integration tests; use a real test DB.
- Access-control helpers must have unit tests covering admin-allowed, partner-denied-admin, inactive-partner-denied, active-partner-allowed.

## Schema Freeze Warning

**Parallel agents MUST NOT edit `prisma/schema.prisma` or shared service signatures after the foundation commit without explicit parent agent approval.**

The Prisma schema is the contract for all workstreams. Changes to schema or shared service APIs affect all parallel lanes. Breaking schema requires:
1. Stopping all parallel agents.
2. Parent agent reviewing and approving the change.
3. Re-running migrations and seed from scratch.
4. Resuming parallel agents from the updated contract.

Violating this rule causes merge conflicts and broken migrations across lanes.

## Module Pattern

```
src/domain/<module>/schema.ts       Zod validation
src/domain/<module>/service.ts      mutations and business rules
src/domain/<module>/queries.ts      read models for pages/tables
src/domain/<module>/types.ts        shared DTOs
src/app/**/actions.ts               thin server action wrappers
```

## Financial Integrity Rules

- Never delete financial history. Void or add negative commission events.
- Snapshot commission rule fields at deal close. Tier changes must not retroactively change paid history.
- `AttributionLock.key @unique` enforces first-attribution at the DB level.
- `PayoutLine.commissionEventId @unique` prevents double-paying the same event.
- Clawbacks are additive negative `CommissionEvent` records, not edits.
