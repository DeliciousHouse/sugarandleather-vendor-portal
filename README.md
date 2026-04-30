# Sugar & Leather Vendor Portal

Internal affiliate and vendor management system for Sugar & Leather AI. Supports partner onboarding, referral attribution, deal tracking, commission staging, and payout management for the Aries AI product line.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres)
- `npm`

## Setup

```bash
docker-compose up -d            # Start Postgres
cp .env.example .env            # Copy env template — fill in required values
npm install
npx prisma migrate dev          # Apply schema migrations
npm run prisma:seed             # Seed default tiers and admin user
npm run dev                     # Start dev server on http://localhost:3000
```

## Environment Variables

All variables are documented in `.env.example`. Required for the app to start:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `APP_URL` | Public base URL (used in emails) |
| `AUTH_SECRET` | Session signing secret — minimum 32 characters |
| `SEED_ADMIN_EMAIL` | Email for the initial admin account created by seed |
| `SEED_ADMIN_NAME` | Display name for the initial admin account |

Optional but needed for full functionality:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Sender address for outgoing email |
| `AGREEMENT_PACKET_URL` | URL for the NDA + agreement packet sent to applicants |

Do not commit `.env`. The `.env.example` is the canonical list of variables.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Production build (Turbopack) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit and component tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E (requires running dev server) |
| `npm run verify` | lint + test + build |
| `npm run prisma:validate` | Validate Prisma schema |
| `npm run prisma:seed` | Seed default tiers and admin user |
| `npx prisma migrate dev` | Apply migrations in dev |
| `npx prisma migrate deploy` | Apply migrations in production |

If `npm run build` fails because `node_modules` is a symlink (common in git worktrees), use:

```bash
npx next build --webpack
```

## Database

Local dev uses Docker Compose with Postgres 16. The default connection string in `.env.example` matches the `docker-compose.yml` service.

Migrations live in `prisma/migrations/`. Always run `npx prisma migrate dev` after pulling schema changes. Never edit migration files by hand.

## Seed Data

`npm run prisma:seed` creates:

- **Affiliate** tier — default commission rules for standard affiliate partners.
- **Authorized Reseller** tier — elevated commission rules for reseller partners.
- **Admin user** — created from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_NAME` env vars.
- **Aries AI** product and initial package codes.

Re-running seed is idempotent for tiers and products. The admin user is upserted.

## Deployment

This app is a standard Next.js App Router application. Deployment checklist:

1. Set all required env vars in the deployment environment. Do not copy `.env` files.
2. Run `npx prisma migrate deploy` before starting the app.
3. Run `npm run prisma:seed` once after the first deploy to create tiers and the admin account.
4. Set `AUTH_SECRET` to a securely generated random string (e.g. `openssl rand -base64 32`).
5. Reset the admin password before exposing the system to real users.
6. `RESEND_API_KEY` and `EMAIL_FROM` must be configured for agreement/invite emails to send.

The app does not self-seed in production — seed is a manual one-time step.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for module layout, auth design, and financial integrity rules.

See [`docs/status-workflows.md`](docs/status-workflows.md) for status transition diagrams.

See [`AGENTS.md`](AGENTS.md) for agent and contributor guidelines.
