# Sugar & Leather Vendor Portal — Architecture

## Overview

Next.js 16 App Router application with server-side business logic, Prisma 7 + PostgreSQL persistence, app-owned session auth, and Resend for transactional email. The app serves two audiences: **partners** (affiliate and reseller) and **admin** (internal staff).

## Auth

**App-owned session with bcrypt passwords.** No external auth provider in MVP.

- `User` model with `role` (`ADMIN` | `PARTNER`) and `status` (`INVITED` | `ACTIVE` | `SUSPENDED` | `DISABLED`).
- Passwords hashed with `bcryptjs`.
- Server-side session cookies (HttpOnly, SameSite=Lax).
- `src/lib/session.ts` — session create/read/destroy.
- `src/lib/auth.ts` — login/logout server actions.
- `src/middleware.ts` — route-level auth and role checks.

Partners can only access `/partner/*` when `AccountStatus` is `ACTIVE`. Activation requires an admin to confirm a signed agreement — there is no self-activation path.

## Admin Bootstrap

The seed script creates the first admin from env vars:

- `SEED_ADMIN_EMAIL` — admin email address.
- `SEED_ADMIN_NAME` — admin display name.

Reset the admin password before exposing the system to real users.

## Module Pattern

```
src/domain/<module>/schema.ts       Zod input validation
src/domain/<module>/service.ts      mutations, business rules, audit logging
src/domain/<module>/queries.ts      read models for pages and tables
src/domain/<module>/types.ts        shared DTOs
src/app/**/actions.ts               thin server action wrappers
```

Modules: `applications`, `agreements`, `referrals`, `deals`, `commissions`, `payouts`, `tiers`, `notifications`, `audit`, `dashboard`, `activity`.

## Route Layout

```
/                       Public landing / redirect
/apply                  Public partner application form
/login                  Login page
/partner/*              Partner portal (requires ACTIVE partner session)
/admin/*                Admin dashboard (requires ADMIN session)
```

Middleware in `src/middleware.ts` enforces these boundaries. Services enforce field-level access in addition.

## Architecture Contracts

1. Server actions are thin wrappers around domain services. No business logic in actions.
2. Domain services enforce authorization, validation, status transitions, audit logging, and idempotency.
3. Prisma access stays in `src/domain/<module>/service.ts` and `src/domain/<module>/queries.ts`. Never query Prisma in page components.
4. Email is sent after DB commit and logged through `Notification` and `EmailLog` records. If send throws, mark as `FAILED` — do not lose the DB record.
5. All admin tables use server-side pagination with deterministic ordering.
6. All financial and legal transitions are idempotent and retry-safe.
7. Middleware is not the only authorization boundary — services enforce access too.
8. Mutating service methods accept a `SessionUser` actor and write an audit log entry.
9. Status transitions live in shared workflow maps, not scattered conditionals. See `docs/status-workflows.md`.

## Financial Integrity

- No financial history is deleted. Void or add negative commission events.
- Commission rules are snapshotted at deal close. Tier changes do not retroactively change historical commissions.
- Attribution is first-come, first-lock, enforced by `AttributionLock.key @unique` at the DB level.
- `PayoutLine.commissionEventId @unique` prevents double-paying the same event.
- Clawbacks are additive negative `CommissionEvent` records, not edits to existing records.

## Email

Transactional email uses Resend (`RESEND_API_KEY`, `EMAIL_FROM`). Email is triggered by:

- Agreement packet send (admin action).
- Partner account invite / activation.
- Critical status change notifications.

Email sending is always a post-commit side effect. Failures are logged, not retried automatically in MVP.

## Seed Data

`npm run prisma:seed` creates:

- **Affiliate** and **Authorized Reseller** tiers with default commission rules.
- **Aries AI** product and initial package codes.
- Admin user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_NAME`.

## Local Development

```bash
docker-compose up -d          # Start Postgres
cp .env.example .env          # Configure env vars
npm install
npm run prisma:validate        # Validate schema
npx prisma migrate dev         # Apply migrations
npm run prisma:seed            # Seed default data
npm run dev                    # Start Next.js dev server
npm run test                   # Run unit/component tests
npm run test:e2e               # Run Playwright E2E tests
```

## Status Diagrams

See [`docs/status-workflows.md`](status-workflows.md) for state machines covering application, referral, agreement, deal, commission, and payout.
