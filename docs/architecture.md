# Sugar & Leather Vendor Portal — Architecture

## Auth Decision

**Choice: App-owned session with bcrypt passwords (no external auth provider for MVP)**

Better Auth was evaluated but deferred due to schema churn risk in MVP. The MVP uses:
- `User` model in Prisma with `role` (ADMIN | PARTNER) and `status` (INVITED | ACTIVE | SUSPENDED | DISABLED)
- bcrypt password hashing via `bcryptjs`
- Server-side session cookies (HttpOnly, SameSite=Lax)
- `src/lib/session.ts` for session create/read/destroy
- `src/lib/auth.ts` for login/logout server actions
- `src/middleware.ts` for route-level auth checks

This gives full control over session shape, role enforcement, and the partner activation gate (only ACTIVE partners can access `/partner/*`). Better Auth can be migrated in after MVP ships if OAuth or magic links are needed.

## Admin Bootstrap

Admin accounts are seeded from environment variables:
- `SEED_ADMIN_EMAIL` — email address for the initial admin user
- `SEED_ADMIN_NAME` — display name for the initial admin user

The seed script (`prisma/seed.ts`) creates the admin user with `role: ADMIN` and `status: ACTIVE`. For local dev, set a known password in the seed script. In production, reset the admin password before exposing the system.

## Module Pattern

```
src/domain/<module>/schema.ts       Zod validation
src/domain/<module>/service.ts      mutations and business rules
src/domain/<module>/queries.ts      read models for pages/tables
src/domain/<module>/types.ts        shared DTOs
src/app/**/actions.ts               thin server action wrappers
```

## Architecture Contracts

1. Server actions are thin wrappers around domain services.
2. Domain services enforce authorization, validation, status transitions, audit logging, and idempotency.
3. Prisma access stays in `src/domain/<module>/service.ts` and `src/domain/<module>/queries.ts`.
4. Email is sent after DB commit and logged through `Notification` and `EmailLog` records.
5. All admin tables use server-side pagination with deterministic ordering.
6. All financial and legal transitions are retry-safe.
7. Middleware is not the only authorization boundary — services enforce access too.
8. Mutating service methods accept an actor/session object and write an audit log.
9. Status transitions live in shared workflow maps, not scattered conditionals.

## Financial Integrity

- No financial history is deleted. Void or add negative commission events.
- Tier changes do not retroactively change historical commissions (rule is snapshotted at deal close).
- Attribution is first-come, first-lock, enforced by `AttributionLock.key @unique`.
- `PayoutLine.commissionEventId @unique` prevents double-paying the same event.

## Local Development

```bash
docker-compose up -d          # Start Postgres
cp .env.example .env          # Configure env vars
npm run prisma:validate        # Validate schema
npx prisma migrate dev         # Apply migrations
npm run prisma:seed            # Seed default data
npm run dev                    # Start Next.js dev server
npm test                       # Run unit/component tests
npm run test:e2e               # Run Playwright E2E tests
```
