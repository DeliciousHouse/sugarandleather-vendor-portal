# Sugar & Leather Affiliate and Vendor Management MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Favor parallel worktrees only after the base app, schema, and design token contracts are in place.

**Goal:** Build a lean internal affiliate and vendor management system for Sugar & Leather AI, initially serving Aries AI and designed to support future products and packages.

**Architecture:** A Next.js App Router application with role-based partner and admin experiences, PostgreSQL persistence through Prisma, server-side business services for attribution and commissions, and manual-first agreement and payout workflows. The MVP should ship one safe vertical slice first, then fill in dashboards and admin controls without inventing unnecessary infrastructure.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Tailwind CSS, Prisma 7, PostgreSQL via Docker for local dev, Better Auth or equivalent app-owned auth chosen before schema migration, Resend email adapter, Vitest, React Testing Library, Playwright. Version pins should be accepted from the generated app/package manager output after initialization. If the named major versions are incompatible, prefer a stable compatible stack over forcing listed version numbers.

---

## Source Inputs

### User prompt
Build an internal affiliate and vendor management system for Sugar & Leather AI, initially for Aries AI but expandable to future products and packages. Create two experiences: a partner portal and an admin dashboard for internal staff. The partner side must support application onboarding with full name, contact info, company, country, promotion channels, AI/tech experience, audience, and subjective questions. Admin reviews applications, then sends NDA and partner agreement by email, and activates the account only after signature. Partners can submit referrals, but referrals must require admin approval before counting, cannot be edited by partners, and attribution must be first-come, first-attribution. Build dashboards for referral status, deal tracking, and earnings. Include dynamic admin-managed tiers, with default Affiliate and Authorized Reseller tiers plus the ability to create custom tiers and assign commission rules. Support commission tracking based on the agreement, including upfront and trailing commissions, payout staging, clawbacks, and quarterly activity tracking. Keep the MVP lean, manual where needed, and include notifications, audit logs, and clear status workflows.

### Brand guideline facts extracted from `SUGAR & LEATHER Brand Guidelines.pdf`

- Brand philosophy: Sugar means creativity, innovation, warmth, and joy. Leather means flexible, durable, earned strength.
- Mission: humanize artificial intelligence while delivering executive coaching and strategic AI leadership.
- Primary colors:
  - Obsidian `#0E0C0F`, primary dark background, headlines on Cream.
  - Cream `#EDE8E1`, primary light background, logo on dark backgrounds, headlines on Obsidian.
  - Lavender `#C5B8D4`, subheadlines on Obsidian, accents, tags, max 20% of composition.
- Secondary colors:
  - Charcoal `#2C2830`, large panels on Obsidian.
  - Deep Plum `#3D3347`, subheadlines on Cream, hover states, subtle dark separators.
  - Mid Gray `#6B6570`, body text on Cream, captions.
  - Warm White `#F7F4F0`, large panels on Cream.
  - Silver `#A8A5AE`, body text on Obsidian, icons, metadata.
  - Mist `#D8D3DE`, divider lines and light separators.
- Typography:
  - Headline: Cormorant Garamond Bold, 3x body size or larger, 100% leading, sentence case without punctuation.
  - Body: Helvetica Neue LT Std 55 Roman, 8-24px, sentence case with punctuation.
  - Sub-headline: Helvetica Neue LT Std 55 Roman, 2x body size, 100% leading, sentence case without punctuation.
  - Code and technical: Courier Prime, 8-24px, 100% leading, only for code blocks, API references, technical documentation.
- Imagery mood: low-key, dramatic, dark backgrounds, one strong light source, chiaroscuro, real leaders, stillness, quiet confidence, desaturated near-monochrome.
- Logo rules: use Obsidian logo on light backgrounds and Cream logo on dark backgrounds. Preserve 1/2-logo clear space. Do not stretch, rotate, add effects, box, stroke, change colors, use gradients, or alter opacity.

### Top-design direction

Use `popular-web-designs` as the top-design reference library, transformed rather than cloned:

- **Linear** for dark-mode-native dashboard density, whisper borders, precise status surfaces, and workmanlike navigation.
- **Stripe** for trustworthy tables, financial state labels, and commission/payout data presentation.
- **Superhuman** for premium restraint, warm cream action surfaces, and confidence without visual noise.

Sugar & Leather overrides all references. The app should feel like Obsidian and Cream first, not like a Linear clone. Avoid editorial/newspaper-block aesthetics.

---

## Product Scope

### MVP must include

1. Public partner application onboarding.
2. Admin application review.
3. Manual NDA and partner agreement email send.
4. Admin-only signed agreement confirmation.
5. Partner account activation only after signature.
6. Partner referral submission.
7. Immutable partner-submitted referrals.
8. First-come attribution lock.
9. Admin referral approval before counting.
10. Partner dashboards for referral status, deal tracking, and earnings.
11. Admin dashboard for applications, partners, referrals, deals, commissions, payouts, tiers, notifications, and audit log.
12. Dynamic tiers with seeded Affiliate and Authorized Reseller defaults.
13. Commission rules for upfront and trailing commissions.
14. Payout staging, manual payout marking, clawbacks, and quarterly activity tracking.
15. Notifications and audit logs for state changes.

### Not in MVP

- Native DocuSign/Dropbox Sign integration. MVP sends agreement links or attachments by email, then staff marks signed after receiving the executed document.
- Automated ACH or wire payouts. MVP produces payable records and manual payout status.
- Full CRM integration. MVP stores external CRM/deal IDs as optional fields.
- Partner-editable referrals. Corrections are admin-only notes or admin field adjustments with audit logs.
- Self-serve tier upgrades. Admin assigns tiers.
- Complex multi-touch attribution. The rule is first valid attribution lock wins.
- Public marketing site. This repo is the partner/admin app.

---


## Step 0: MVP Vertical Slice and Scope Cutline

Before implementation, lock the P0 slice and keep every early task pointed at this path:

1. Public application submission.
2. Admin application approval.
3. Manual agreement email send.
4. Admin signed-evidence confirmation.
5. Partner activation only after signed evidence.
6. Active partner referral submission.
7. Immutable referral record.
8. Transactional first-attribution lock.
9. Admin referral approval before counting.
10. Admin deal creation and `WON` transition.
11. Commission staging from a snapshotted rule.
12. Manual payable/paid payout transition.
13. Audit log for every state transition.

P1 unless needed to prove the slice:

- Rich dashboards beyond basic tables and metric cards.
- Advanced notification center polish.
- Quarterly activity UI polish and automatic enforcement.
- Complex tier review workflows.
- Payout export polish.
- Email automation beyond agreement/invite/critical status notifications.
- Visual refinements beyond reusable brand primitives.

This cutline matters because the product prompt asks for a lean, manual MVP. The critical risk is not whether we can build tables. It is whether legal activation, referral attribution, commission staging, and auditability work end to end without losing trust.

---

## Core Workflows

### Application to activation

```text
Applicant submits /apply
  -> Application status: SUBMITTED
  -> Admin reviews
      -> reject: REJECTED, email optional
      -> approve: APPROVED_PENDING_AGREEMENT
          -> admin sends NDA + agreement email
          -> Agreement status: SENT
          -> admin receives signed docs manually
          -> admin marks Agreement SIGNED and uploads/stores signed file metadata
          -> Partner account status: ACTIVE
          -> Invite email sent / login enabled
```

### Referral and attribution

```text
Partner submits referral
  -> Normalize attribution key from lead email, or company domain when email is absent
  -> Transaction attempts to create AttributionLock(key)
      -> success: referral attributionStatus = FIRST_ATTRIBUTED
      -> unique conflict: referral attributionStatus = DUPLICATE_NO_CREDIT
  -> Referral status = PENDING_REVIEW
  -> Admin reviews
      -> approve: APPROVED, eligible for deal/commission tracking only if FIRST_ATTRIBUTED
      -> reject: REJECTED, never counted
  -> Referral cannot be edited by partner after create
```

### Deal and commission lifecycle

```text
Admin creates/updates deal from approved attributed referral
  -> Deal status: OPEN | WON | LOST | CANCELLED
  -> On WON, commission engine snapshots partner agreement + tier rules
  -> CommissionEvents created:
      - UPFRONT_STAGED after close
      - TRAILING_STAGED per trailing period when applicable
  -> Payout staging waits for configured hold/clawback window
  -> Admin marks payable events PAID in a payout batch
  -> Clawback creates negative CommissionEvent and audit log
```

### Quarterly activity tracking

```text
Quarter starts
  -> System aggregates partner activity:
      referrals submitted
      referrals approved
      deals won
      revenue attributed
      payout earned
  -> Admin dashboard shows activity vs tier requirements
  -> Admin can manually override tier review outcome with reason
```

---

## Data Model Outline

Implement in `prisma/schema.prisma` with explicit enums, relations, timestamps, indexes, and audit-friendly status fields. This schema is a contract. Freeze it before launching parallel agents.

### Enums

```prisma
enum UserRole { ADMIN PARTNER }
enum AccountStatus { INVITED ACTIVE SUSPENDED DISABLED }
enum ApplicationStatus { SUBMITTED IN_REVIEW REJECTED APPROVED_PENDING_AGREEMENT AGREEMENT_SENT SIGNED ACTIVATED }
enum AgreementStatus { DRAFT SENT SIGNED VOIDED EXPIRED }
enum ReferralStatus { PENDING_REVIEW APPROVED REJECTED CONVERTED LOST }
enum AttributionStatus { FIRST_ATTRIBUTED DUPLICATE_NO_CREDIT }
enum DealStatus { OPEN WON LOST CANCELLED }
enum CommissionKind { UPFRONT TRAILING CLAWBACK ADJUSTMENT }
enum CommissionStatus { STAGED PAYABLE PAID VOIDED CLAWED_BACK }
enum PayoutStatus { DRAFT PROCESSING PAID VOIDED }
enum NotificationChannel { EMAIL IN_APP }
enum NotificationStatus { QUEUED SENT FAILED READ DISMISSED }
enum ActorType { USER SYSTEM }
```

For MVP, first attribution is immutable forever. Do not implement `VOIDED_RELEASED` or reusable attribution keys unless the migration uses a deliberate Postgres partial unique index. A voided lock can stop credit, but it does not release the key.

### Core auth and partner records

```prisma
model User {
  id        String        @id @default(cuid())
  email     String        @unique
  name      String?
  role      UserRole
  status    AccountStatus @default(INVITED)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  partner   Partner?
}

model PartnerApplication {
  id                 String            @id @default(cuid())
  status             ApplicationStatus @default(SUBMITTED)
  fullName           String
  email              String
  phone              String?
  company            String?
  country            String
  promotionChannels  String[]
  aiTechExperience   String
  audience           String
  subjectiveAnswers  Json
  reviewedById       String?
  reviewedAt         DateTime?
  reviewNotes        String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  @@index([status, createdAt])
  @@index([email])
}

model Partner {
  id              String        @id @default(cuid())
  userId          String        @unique
  applicationId   String?       @unique
  tierId          String
  status          AccountStatus @default(INVITED)
  displayName     String
  company         String?
  country         String?
  activatedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id])
  tier Tier @relation(fields: [tierId], references: [id])

  @@index([tierId, status])
}
```

### Product/package catalog

Use real tables instead of scattered string literals, but keep the model small.

```prisma
model Product {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductPackage {
  id          String   @id @default(cuid())
  productCode String
  code        String
  name        String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([productCode, code])
}
```

Seed `ARIES_AI` and initial package codes in `prisma/seed.ts`. Future products use the same tables.

### Agreements

```prisma
model Agreement {
  id                 String          @id @default(cuid())
  applicationId      String?
  partnerId          String?
  status             AgreementStatus @default(DRAFT)
  ndaVersion         String
  agreementVersion   String
  packetUrl          String?
  sentAt             DateTime?
  sentById           String?
  signedAt           DateTime?
  signedById         String?
  signedEvidenceUrl  String?
  signedEvidenceNote String?
  voidReason         String?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([status, sentAt])
  @@index([partnerId, status])
}
```

P0 uses `signedEvidenceUrl` or `signedEvidenceNote`. Do not build local file uploads unless explicitly requested.

### Tiers and rules

```prisma
model Tier {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  partners Partner[]
  rules    CommissionRule[]
}

model CommissionRule {
  id                    String         @id @default(cuid())
  tierId                String
  productCode           String
  packageCode           String?
  kind                  CommissionKind
  percentBps            Int?
  flatAmountCents       Int?
  currency              String         @default("USD")
  trailingMonths        Int?
  payoutDelayDays       Int            @default(30)
  clawbackWindowDays    Int            @default(90)
  quarterlyMinReferrals Int?
  startsAt              DateTime       @default(now())
  endsAt                DateTime?
  isActive              Boolean        @default(true)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  tier Tier @relation(fields: [tierId], references: [id])

  @@index([tierId, isActive])
  @@index([productCode, packageCode, kind, isActive])
}
```

### Referrals and attribution

```prisma
model Referral {
  id                String            @id @default(cuid())
  partnerId         String
  attributionLockId String?
  status            ReferralStatus    @default(PENDING_REVIEW)
  attributionStatus AttributionStatus
  leadName          String
  leadEmail         String?
  leadCompany       String?
  leadDomain        String?
  attributionKey    String
  country           String?
  originalPayload   Json
  notes             String?
  adminNotes        String?
  submittedAt       DateTime          @default(now())
  reviewedById      String?
  reviewedAt        DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([partnerId, status, submittedAt])
  @@index([status, submittedAt])
  @@index([attributionKey])
}

model AttributionLock {
  id              String   @id @default(cuid())
  key             String   @unique
  firstReferralId String?  @unique
  partnerId       String
  lockedAt        DateTime @default(now())
  voidedAt        DateTime?
  voidReason      String?

  @@index([partnerId, lockedAt])
}
```

Use prefixed keys from `src/domain/referrals/normalize.ts`, e.g. `email:lead@example.com` or `domain:example.com`.

### Deals, commissions, payouts

```prisma
model Deal {
  id             String     @id @default(cuid())
  referralId     String     @unique
  partnerId      String
  productCode    String
  packageCode    String?
  status         DealStatus @default(OPEN)
  amountCents    Int
  currency       String     @default("USD")
  externalCrmId  String?
  closedAt       DateTime?
  lostReason     String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([partnerId, status, closedAt])
  @@index([status, closedAt])
}

model CommissionEvent {
  id                       String           @id @default(cuid())
  partnerId                String
  dealId                   String
  ruleId                   String?
  kind                     CommissionKind
  status                   CommissionStatus @default(STAGED)
  amountCents              Int
  currency                 String           @default("USD")
  sourceRevenueCents       Int?
  percentBpsSnapshot       Int?
  flatAmountCentsSnapshot  Int?
  tierNameSnapshot         String
  productCodeSnapshot      String
  packageCodeSnapshot      String?
  periodStart              DateTime?
  periodEnd                DateTime?
  payoutEligibleAt         DateTime
  paidAt                   DateTime?
  clawbackOfEventId        String?          @unique
  reason                   String?
  createdAt                DateTime         @default(now())
  updatedAt                DateTime         @updatedAt

  @@index([partnerId, status, payoutEligibleAt])
  @@index([status, payoutEligibleAt])
  @@index([dealId, kind, periodStart])
}

model PayoutBatch {
  id          String       @id @default(cuid())
  status      PayoutStatus @default(DRAFT)
  periodStart DateTime?
  periodEnd   DateTime?
  currency    String       @default("USD")
  notes       String?
  createdById String
  paidAt      DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model PayoutLine {
  id                String   @id @default(cuid())
  payoutBatchId     String
  commissionEventId String   @unique
  partnerId         String
  amountCents       Int
  currency          String   @default("USD")
  createdAt         DateTime @default(now())

  @@index([payoutBatchId])
  @@index([partnerId])
}
```

`PayoutLine.commissionEventId @unique` prevents double-paying the same event. Clawbacks are additive negative `CommissionEvent` records.

### Activity, notifications, email logs, audit logs

```prisma
model QuarterlyActivitySnapshot {
  id                 String   @id @default(cuid())
  partnerId          String
  quarter            String
  referralsSubmitted Int      @default(0)
  referralsApproved  Int      @default(0)
  dealsWon           Int      @default(0)
  revenueCents       Int      @default(0)
  commissionCents    Int      @default(0)
  overrideStatus     String?
  overrideReason     String?
  generatedAt        DateTime @default(now())

  @@unique([partnerId, quarter])
}

model Notification {
  id        String             @id @default(cuid())
  userId    String?
  channel   NotificationChannel
  status    NotificationStatus @default(QUEUED)
  title     String
  body      String
  entityType String?
  entityId   String?
  readAt    DateTime?
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  @@index([userId, readAt, createdAt])
  @@index([status, createdAt])
}

model EmailLog {
  id             String             @id @default(cuid())
  notificationId String?
  to             String
  subject        String
  status         NotificationStatus @default(QUEUED)
  providerId     String?
  error          String?
  sentAt         DateTime?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([status, createdAt])
}

model AuditLog {
  id         String    @id @default(cuid())
  actorId    String?
  actorType  ActorType @default(USER)
  action     String
  entityType String
  entityId   String
  before     Json?
  after      Json?
  reason     String?
  createdAt  DateTime  @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([actorId, createdAt])
  @@index([createdAt])
}
```

Redact sensitive payloads before writing to `AuditLog` if they include secrets or private legal notes.

---

## Security and Integrity Rules

1. Partner users can read only their own partner, referrals, deals, commissions, notifications, and agreement state.
2. Admin routes require `UserRole.ADMIN`.
3. Partner-created referrals are immutable by partners after insert.
4. Admin edits to referral/deal/commission records must write `AuditLog` entries.
5. First attribution is enforced in the database with a unique `AttributionLock.key`.
6. Referral approval and attribution are separate:
   - approval decides whether the referral is valid,
   - attribution decides whether it can count for this partner.
7. Commission calculations snapshot the active agreement and tier/rule at deal close. Later tier changes must not rewrite historical commissions.
8. Clawbacks are additive negative events, not destructive edits to paid history.
9. Email sends should be logged even when they fail.
10. Manual override fields require a reason.

---


## Architecture Contracts

These contracts prevent parallel agents from turning the app into a pile of clever one-offs.

1. Server actions are thin wrappers around domain services.
2. Domain services enforce authorization, validation, status transitions, audit logging, and idempotency.
3. Prisma access stays in `src/domain/<module>/service.ts` and `src/domain/<module>/queries.ts`, not page components.
4. Email is sent after DB commit and logged through `Notification` and `EmailLog` records.
5. All admin tables use server-side pagination and deterministic ordering.
6. All financial and legal transitions are retry-safe.
7. Middleware is not the only authorization boundary. Services must enforce access.
8. Parallel agents must not edit Prisma schema or shared service signatures after contract freeze without parent approval.
9. Mutating service methods accept an actor/session object and write an audit log for state changes.
10. Status transitions live in shared workflow maps, not scattered conditionals.

Recommended module pattern:

```text
src/domain/<module>/schema.ts       Zod validation
src/domain/<module>/service.ts      mutations and business rules
src/domain/<module>/queries.ts      read models for pages/tables
src/domain/<module>/types.ts        shared DTOs when needed
src/app/**/actions.ts               thin wrappers only
```

---

## Frontend Information Architecture

### Public and partner routes

```text
/apply
/partner/pending
/partner
/partner/referrals
/partner/referrals/new
/partner/deals
/partner/earnings
/partner/agreements
/partner/settings
```

### Admin routes

```text
/admin
/admin/applications
/admin/applications/[id]
/admin/agreements
/admin/partners
/admin/partners/[id]
/admin/referrals
/admin/referrals/[id]
/admin/deals
/admin/deals/[id]
/admin/tiers
/admin/tiers/[id]
/admin/commissions
/admin/payouts
/admin/payouts/[id]
/admin/audit
/admin/notifications
```

### Shared UI modules

```text
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Badge.tsx
src/components/ui/StatusPill.tsx
src/components/ui/DataTable.tsx
src/components/ui/FormField.tsx
src/components/ui/EmptyState.tsx
src/components/ui/Timeline.tsx
src/components/layout/AppShell.tsx
src/components/layout/Sidebar.tsx
src/components/layout/PageHeader.tsx
src/components/brand/Logo.tsx
src/styles/tokens.css
```

---

## Design System Plan

### Tokens

Create `src/styles/tokens.css`:

```css
:root {
  --sl-obsidian: #0E0C0F;
  --sl-cream: #EDE8E1;
  --sl-lavender: #C5B8D4;
  --sl-charcoal: #2C2830;
  --sl-deep-plum: #3D3347;
  --sl-mid-gray: #6B6570;
  --sl-warm-white: #F7F4F0;
  --sl-silver: #A8A5AE;
  --sl-mist: #D8D3DE;

  --surface-root: var(--sl-obsidian);
  --surface-panel: var(--sl-charcoal);
  --surface-panel-hover: var(--sl-deep-plum);
  --surface-cream: var(--sl-cream);
  --surface-warm: var(--sl-warm-white);
  --text-primary-dark: var(--sl-cream);
  --text-secondary-dark: var(--sl-silver);
  --text-primary-light: var(--sl-obsidian);
  --text-secondary-light: var(--sl-mid-gray);
  --accent: var(--sl-lavender);
  --border-dark: rgba(237, 232, 225, 0.12);
  --border-light: var(--sl-mist);
}
```

### Typography substitutes

- Use `Cormorant Garamond` from Google Fonts for headings.
- Use `Inter` as a practical Helvetica Neue substitute for app UI body text.
- Use `Courier Prime` for technical/code-only surfaces.

### Layout tone

- Admin dashboard: Obsidian root, Charcoal panels, Cream headings, Silver metadata, Lavender for active states and tags.
- Partner portal: slightly warmer and less dense, still dark-first, with Cream cards for key calls to action when needed.
- Tables: Stripe-inspired clarity, but rendered in Obsidian/Charcoal with Mist dividers.
- Status workflows: clear and legible. Use semantic accents sparingly, never make Lavender carry destructive or success meaning alone.

---

## Implementation Tasks

### Task 1: Initialize the Next.js application

**Objective:** Replace the placeholder repo with a typed Next.js app while preserving the brand PDF and existing README.

**Files:**
- Create: `package.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`

**Steps:**
1. Run `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`.
2. If create-next-app refuses because the directory is non-empty, create in `/tmp/slvp-next`, then copy generated app files into this repo without overwriting the brand PDF.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Commit: `git add package.json package-lock.json next.config.* tsconfig.json src .gitignore && git commit -m "chore: initialize Next.js app"`.

**Expected:** Next.js app builds and `/` renders a temporary Sugar & Leather Vendor Portal landing screen.

### Task 2: Add local database and environment scaffolding

**Objective:** Make local development reproducible with Postgres, env examples, auth choice, and admin bootstrap.

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `prisma/schema.prisma`
- Create: `src/lib/env.ts`
- Create: `docs/architecture.md`

**Steps:**
1. Add Postgres service in `docker-compose.yml`.
2. Choose and document the auth library before schema migration. Prefer an app-owned `User`/role/status contract even if the library owns credential tables.
3. Add `DATABASE_URL`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, and `AGREEMENT_PACKET_URL` to `.env.example`.
4. Install Prisma: `npm install prisma @prisma/client`.
5. Add `src/lib/env.ts` with Zod validation.
6. Document admin bootstrap in `docs/architecture.md`.
7. Run `npx prisma validate`.
8. Commit: `git add docker-compose.yml .env.example prisma src/lib/env.ts docs/architecture.md package*.json && git commit -m "chore: add database auth and env scaffolding"`.

### Task 3: Add test harness

**Objective:** Establish unit, component, and E2E test commands before building features.

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Modify: `package.json`

**Steps:**
1. Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom playwright`.
2. Add scripts: `test`, `test:watch`, `test:e2e`, `verify`.
3. Add smoke test for `/`.
4. Run `npm run test` and `npm run test:e2e` after starting dev server.
5. Commit: `git add vitest.config.ts playwright.config.ts tests package*.json && git commit -m "test: add test harness"`.

### Task 4: Implement brand tokens and shared UI primitives

**Objective:** Create the Sugar & Leather visual foundation before feature screens.

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/StatusPill.tsx`
- Create: `src/components/brand/Logo.tsx`
- Test: `tests/components/ui-primitives.test.tsx`

**Steps:**
1. Write failing render tests for Button, Card, and StatusPill variants.
2. Implement tokens and UI primitives.
3. Use Cormorant Garamond, Inter, and Courier Prime font setup in `layout.tsx`.
4. Run `npm run test -- tests/components/ui-primitives.test.tsx`.
5. Commit: `git add src/styles src/components tests/components && git commit -m "feat: add Sugar and Leather UI primitives"`.

### Task 5: Implement Prisma schema and seed defaults

**Objective:** Create the complete schema contract for all P0/P1 modules before parallel work begins, including auth/user ownership, indexes, idempotency constraints, status fields, money fields, and seed data.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json`
- Test: `tests/domain/schema-shape.test.ts`

**Steps:**
1. Add enums and models from the Data Model Outline.
2. Add indexes:
   - `AttributionLock.key @unique`
   - `Referral.partnerId/status/submittedAt`
   - `Deal.referralId/status`
   - `CommissionEvent.partnerId/status/payoutEligibleAt`
   - `AuditLog.entityType/entityId/createdAt`
3. Add idempotency constraints for attribution, commission staging, payout lines, and clawbacks.
4. Seed admin user from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_NAME`.
5. Seed tiers: `Affiliate`, `Authorized Reseller`.
6. Seed Aries product/package codes and default commission rules needed for E2E.
7. Run `npx prisma migrate dev --name init_affiliate_vendor_mvp`.
8. Run `npx prisma db seed`.
9. Commit migration and seed.

### Task 6: Add audit logging service

**Objective:** Centralize audit writes so state changes are traceable from day one.

**Files:**
- Create: `src/lib/audit.ts`
- Test: `tests/domain/audit.test.ts`

**Steps:**
1. Write tests for `writeAuditLog({ actorId, action, entityType, entityId, before, after })`.
2. Implement helper with JSON before/after snapshots.
3. Add no-op-safe behavior for system actor.
4. Commit: `git add src/lib/audit.ts tests/domain/audit.test.ts && git commit -m "feat: add audit logging helper"`.

### Task 7: Add auth, roles, and route protection

**Objective:** Support admin and partner access with activation gates.

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/session.ts`
- Create: `src/app/login/page.tsx`
- Test: `tests/domain/access-control.test.ts`

**Steps:**
1. Use the auth library selected in Task 2. Implement role/status persistence according to the Task 5 schema contract.
2. Write tests for `requireAdmin`, `requirePartner`, inactive partner redirect, partner denied from admin actions, inactive partner denied from referral submission, and partner denied from another partner's records.
3. Implement route protection:
   - `/admin/*` admin only.
   - `/partner/*` active partner only, except `/partner/pending`.
4. Commit: `git add src/lib/auth.ts src/lib/session.ts src/middleware.ts src/app/login tests/domain/access-control.test.ts && git commit -m "feat: add role-based access control"`.

### Task 8: Add application validation and service

**Objective:** Validate application intake fields and preserve subjective answers.

**Files:**
- Create: `src/domain/applications/schema.ts`
- Create: `src/domain/applications/service.ts`
- Test: `tests/domain/applications.test.ts`

**Steps:**
1. Write Zod schema tests for required fields: full name, email, contact info, company, country, promotion channels, AI/tech experience, audience, subjective answers.
2. Implement `submitApplication(input)` with duplicate email protection.
3. Write audit log on submission.
4. Commit.

### Task 9: Build public application onboarding

**Objective:** Create `/apply` with clear, brand-aligned form UX.

**Files:**
- Create: `src/app/apply/page.tsx`
- Create: `src/app/apply/actions.ts`
- Create: `src/components/applications/ApplicationForm.tsx`
- Test: `tests/components/application-form.test.tsx`
- E2E: `tests/e2e/application-flow.spec.ts`

**Steps:**
1. Build a multi-section form, not a fake wizard unless needed.
2. Include fields from the prompt exactly.
3. Show success screen with manual review expectation.
4. Run component and E2E tests.
5. Commit.

### Task 10: Build admin application review

**Objective:** Let staff review, reject, or approve applications.

**Files:**
- Create: `src/app/admin/applications/page.tsx`
- Create: `src/app/admin/applications/[id]/page.tsx`
- Create: `src/app/admin/applications/[id]/actions.ts`
- Create: `src/components/applications/ApplicationReviewPanel.tsx`
- Test: `tests/domain/application-review.test.ts`

**Steps:**
1. Write service tests for status transitions.
2. Implement `markInReview`, `rejectApplication`, `approvePendingAgreement`.
3. Add admin notes and audit logs.
4. Render clear status timeline.
5. Commit.

### Task 11: Add agreement send and signed activation workflow

**Objective:** Keep legal workflow manual but stateful and auditable.

**Files:**
- Create: `src/domain/agreements/service.ts`
- Create: `src/lib/email.ts`
- Create: `src/emails/AgreementPacketEmail.tsx`
- Create: `src/app/admin/agreements/page.tsx`
- Create: `src/app/admin/agreements/[id]/actions.ts`
- Test: `tests/domain/agreements.test.ts`

**Steps:**
1. Write tests for allowed transitions: draft -> sent -> signed -> activated.
2. Implement `sendAgreementPacket(applicationId)` using Resend adapter behind `src/lib/email.ts`, agreement/NDA versions, `AGREEMENT_PACKET_URL`, and explicit resend behavior.
3. Write `Notification` and `EmailLog` records in the DB transaction, send email after commit, then mark send `SENT` or `FAILED`.
4. Implement `markAgreementSigned` with signed document URL or manual evidence note.
5. Implement `activatePartnerFromSignedAgreement` with a hard guard requiring signed evidence.
6. Send partner invite/activation email.
7. Commit.

### Task 12: Add referral attribution service

**Objective:** Enforce first-come, first-attribution with database uniqueness and transactions.

**Files:**
- Create: `src/domain/referrals/normalize.ts`
- Create: `src/domain/referrals/service.ts`
- Test: `tests/domain/referral-attribution.test.ts`

**Steps:**
1. Write tests for normalization:
   - email lowercasing and trimming,
   - company domain fallback,
   - missing attribution key rejection.
2. Write tests for first submission creating `AttributionLock`.
3. Write tests for second submission returning `DUPLICATE_NO_CREDIT`.
4. Write a real Postgres integration test that simulates duplicate submissions and verifies the unique key protects the winner.
5. Use prefixed keys such as `email:lead@example.com` and `domain:example.com`.
6. Keep first attribution immutable for MVP. Voiding can stop credit but does not release the key.
7. Implement transaction with unique constraint handling.
8. Commit.

### Task 13: Build partner referral submission and list

**Objective:** Let active partners submit referrals and see immutable status.

**Files:**
- Create: `src/app/partner/referrals/page.tsx`
- Create: `src/app/partner/referrals/new/page.tsx`
- Create: `src/app/partner/referrals/actions.ts`
- Create: `src/components/referrals/ReferralForm.tsx`
- Create: `src/components/referrals/ReferralStatusTable.tsx`
- Test: `tests/components/referral-form.test.tsx`
- E2E: `tests/e2e/partner-referral.spec.ts`

**Steps:**
1. Build create-only form.
2. Do not include partner edit controls.
3. Show statuses: pending review, approved, duplicate/no credit, rejected, converted, lost.
4. Add copy explaining referrals count only after admin approval.
5. Commit.

### Task 14: Build admin referral approval queue

**Objective:** Give staff a safe queue for approving, rejecting, and explaining duplicate/no-credit referrals.

**Files:**
- Create: `src/app/admin/referrals/page.tsx`
- Create: `src/app/admin/referrals/[id]/page.tsx`
- Create: `src/app/admin/referrals/[id]/actions.ts`
- Create: `src/components/referrals/AdminReferralPanel.tsx`
- Test: `tests/domain/referral-review.test.ts`

**Steps:**
1. Write transition tests for approve/reject.
2. Block approval from counting if `attributionStatus = DUPLICATE_NO_CREDIT`.
3. Audit every decision.
4. Commit.

### Task 15: Add deal tracking service and admin deal UI

**Objective:** Track deal status for approved attributed referrals.

**Files:**
- Create: `src/domain/deals/service.ts`
- Create: `src/app/admin/deals/page.tsx`
- Create: `src/app/admin/deals/[id]/page.tsx`
- Create: `src/app/admin/deals/[id]/actions.ts`
- Test: `tests/domain/deals.test.ts`

**Steps:**
1. Write tests preventing deal creation from rejected, pending, or duplicate/no-credit referrals.
2. Implement create/update deal with product/package, amount, status, external ID.
3. On `WON`, call commission staging service.
4. Prove marking `WON` twice cannot double-stage commission events.
5. Commit.

### Task 16: Add commission rule and calculation service

**Objective:** Calculate upfront/trailing commissions from agreement and tier rules.

**Files:**
- Create: `src/domain/commissions/rules.ts`
- Create: `src/domain/commissions/service.ts`
- Test: `tests/domain/commissions.test.ts`

**Steps:**
1. Write tests for percentage upfront commission.
2. Write tests for flat upfront commission.
3. Write tests for trailing monthly commission events.
4. Write tests that historical commission events do not change after tier rule edits.
5. Implement rule snapshot fields on `CommissionEvent`: tier name, product/package, percent/flat value, revenue, currency, eligible date.
6. Add uniqueness/idempotency guards for deal/kind/period staging.
7. Commit.

### Task 17: Build admin tier and commission rule management

**Objective:** Let admins create custom tiers and assign commission rules.

**Files:**
- Create: `src/app/admin/tiers/page.tsx`
- Create: `src/app/admin/tiers/[id]/page.tsx`
- Create: `src/app/admin/tiers/[id]/actions.ts`
- Create: `src/components/tiers/TierRuleEditor.tsx`
- Test: `tests/domain/tiers.test.ts`

**Steps:**
1. Show seeded Affiliate and Authorized Reseller tiers.
2. Allow create/edit/deactivate custom tiers.
3. Allow rule creation for product/package, upfront/trailing, payout delay, clawback window, quarterly minimums.
4. Prevent destructive deletion of tiers with partners/history. Use deactivate.
5. Commit.

### Task 18: Add payout staging and clawbacks

**Objective:** Support staged, payable, paid, and clawed-back commission lifecycle.

**Files:**
- Create: `src/domain/payouts/service.ts`
- Create: `src/app/admin/payouts/page.tsx`
- Create: `src/app/admin/payouts/[id]/page.tsx`
- Create: `src/app/admin/payouts/[id]/actions.ts`
- Test: `tests/domain/payouts.test.ts`

**Steps:**
1. Write tests moving commission events from staged to payable after delay.
2. Write tests creating payout batches and marking events paid.
3. Write tests for clawback creating negative events and not deleting paid history.
4. Prove payout batches cannot include already-paid events.
5. Require a reason for clawback and prevent duplicate clawback for the same event unless explicitly modeled as a separate adjustment.
6. Implement admin payout UI with manual export table.
7. Commit.

### Task 19: Add quarterly activity tracking

**Objective:** Show activity against tier requirements without making it automatic enforcement yet.

**Files:**
- Create: `src/domain/activity/service.ts`
- Create: `src/app/admin/partners/[id]/activity/page.tsx`
- Create: `src/components/activity/QuarterlyActivityCard.tsx`
- Test: `tests/domain/quarterly-activity.test.ts`

**Steps:**
1. Write tests aggregating referrals, approved referrals, won deals, and revenue by quarter.
2. Compare against active tier requirements.
3. Allow admin manual override with reason.
4. Commit.

### Task 20: Build partner dashboards

**Objective:** Give partners a clear read on status, deals, and earnings.

**Files:**
- Create: `src/app/partner/page.tsx`
- Create: `src/app/partner/deals/page.tsx`
- Create: `src/app/partner/earnings/page.tsx`
- Create: `src/components/dashboard/MetricCard.tsx`
- Create: `src/components/dashboard/EarningsTimeline.tsx`
- Test: `tests/components/partner-dashboard.test.tsx`

**Steps:**
1. Show referral counts by status.
2. Show deal list and statuses without exposing admin-only notes.
3. Show earnings by staged/payable/paid/clawed-back.
4. Explain payout timing and clawback windows.
5. Commit.

### Task 21: Build admin dashboard overview

**Objective:** Give staff a command center for work queues.

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/dashboard/AdminWorkQueue.tsx`
- Create: `src/components/dashboard/AdminRevenueSnapshot.tsx`
- Test: `tests/components/admin-dashboard.test.tsx`

**Steps:**
1. Show applications pending review.
2. Show agreements awaiting signature.
3. Show referrals pending approval.
4. Show payable commissions.
5. Show recent audit events.
6. Commit.

### Task 22: Add notifications

**Objective:** Notify partners and admins on key workflow changes.

**Files:**
- Create: `src/domain/notifications/service.ts`
- Create: `src/components/notifications/NotificationList.tsx`
- Create: `src/app/admin/notifications/page.tsx`
- Test: `tests/domain/notifications.test.ts`

**Steps:**
1. Write tests for notification creation on application approval, agreement sent, referral approved/rejected, deal won/lost, commission payable, clawback.
2. Implement in-app notifications first.
3. Use `src/lib/email.ts` for email notifications where required.
4. Commit.

### Task 23: Add audit log UI

**Objective:** Make state changes inspectable by staff.

**Files:**
- Create: `src/app/admin/audit/page.tsx`
- Create: `src/components/audit/AuditLogTable.tsx`
- Test: `tests/components/audit-log.test.tsx`

**Steps:**
1. Display actor, action, entity, timestamp, and JSON diff summary.
2. Add filters by entity type and actor.
3. Keep full JSON behind a disclosure panel.
4. Commit.

### Task 24: Add E2E coverage for critical workflows

**Objective:** Prove the MVP works from user-visible flows, not just service tests.

**Files:**
- Create: `tests/e2e/application-to-activation.spec.ts`
- Create: `tests/e2e/referral-attribution.spec.ts`
- Create: `tests/e2e/commission-payout.spec.ts`

**Steps:**
1. Test application submission -> admin approval -> agreement signed -> activation.
2. Test duplicate referral attribution across two partners.
3. Test won deal -> staged commission -> payable -> paid -> clawback.
4. Commit.

### Task 25: Accessibility, responsive, and visual QA pass

**Objective:** Polish the two experiences for real use.

**Files:**
- Modify: touched UI files only.
- Create: `docs/qa/manual-smoke-checklist.md`

**Steps:**
1. Verify keyboard navigation for forms, tables, and admin actions.
2. Verify focus rings are visible on Obsidian and Cream surfaces.
3. Verify mobile layout for `/apply`, partner dashboard, and admin queues.
4. Add manual smoke checklist.
5. Commit.

### Task 26: Documentation and deployment notes

**Objective:** Make the repo operable by future agents and humans.

**Files:**
- Modify: `README.md`
- Create: `AGENTS.md`
- Create: `docs/architecture.md`
- Create: `docs/status-workflows.md`

**Steps:**
1. Document setup, env, database, test commands, seed data, and deployment assumptions.
2. Add status diagrams for application, referral, agreement, deal, commission, payout.
3. Add agent guidance: run tests, avoid direct partner referral edits, preserve brand tokens.
4. Commit.

---

## Test Strategy

### Unit/domain tests

- Application validation and duplicate handling.
- Agreement status transitions.
- Referral normalization and attribution lock creation.
- Referral admin review transitions.
- Deal creation restrictions.
- Commission calculation and rule snapshots.
- Payout staging and clawbacks.
- Quarterly activity aggregation.
- Audit and notification side effects.


### Integration and safety tests

- Real Postgres attribution lock concurrency.
- Auth negative tests for pages and server actions.
- Migration reset plus seed from scratch.
- Email failure logging and retry behavior.
- Idempotency for agreement send, signed activation, deal `WON`, commission staging, payout paid, and clawback.
- Quarter boundary and timezone tests.
- Audit log existence for every admin transition.
- Basic accessibility checks with `@axe-core/playwright` on `/apply`, `/partner`, and `/admin`.

### Component tests

- Application form required fields.
- Referral form create-only behavior.
- Admin review panels.
- Tier rule editor.
- Status pill variants.
- Partner and admin dashboard summaries.

### E2E tests

- Application to activation.
- First partner wins attribution, second partner gets duplicate/no-credit.
- Referral approval -> deal won -> commission staged -> payout paid.
- Partner cannot edit a submitted referral.
- Inactive partner cannot access `/partner` except pending state.

### Manual smoke checklist

- Brand treatment on primary pages.
- Mobile form usability.
- Email copy previews.
- Admin state transitions feel explicit and irreversible where appropriate.
- Audit log records every admin decision.

---

## Execution Phase: Parallel Agent Strategy

Do not parallelize Task 1-7. They establish the base app, schema, test harness, shared tokens, audit helper, and auth/access contract. Before parallel lanes start, the parent agent must freeze schema and domain service contracts. Parallel agents must not edit Prisma schema or shared service signatures without parent approval. After Task 7 lands and builds, use parallel worktrees with independent agents.

### Dependency table

| Workstream | Modules touched | Depends on |
|---|---|---|
| Foundation | `src/app`, `src/styles`, `src/components/ui`, `prisma` | none |
| Auth and access | `src/lib/auth`, `src/middleware`, `src/app/login` | Foundation, schema |
| Applications and agreements | `src/domain/applications`, `src/domain/agreements`, `src/app/apply`, `src/app/admin/applications`, `src/app/admin/agreements` | Auth and access |
| Referrals and attribution | `src/domain/referrals`, `src/app/partner/referrals`, `src/app/admin/referrals` | Auth and access, schema |
| Deals and commissions | `src/domain/deals`, `src/domain/commissions`, `src/app/admin/deals`, `src/app/admin/commissions` | Referrals service contract, tiers schema |
| Tiers and payout ops | `src/domain/payouts`, `src/app/admin/tiers`, `src/app/admin/payouts` | Commissions service contract |
| Dashboards and notifications | `src/components/dashboard`, `src/domain/notifications`, `src/app/partner`, `src/app/admin` | Applications, referrals, deals contracts |
| QA and docs | `tests/e2e`, `docs`, `README.md`, `AGENTS.md` | All feature work |

### Parallel lanes

- **Lane A:** Applications and agreements.
- **Lane B:** Referrals and attribution.
- **Lane C:** Tiers, commission rules, and payout services.
- **Lane D:** Shared dashboard views and notification UI.

### Safe launch order

1. Sequential: Tasks 1-7.
2. Parallel batch 1: Lane A Task 8-11 and Lane B Task 12-14. These share only schema contracts and should avoid the same files.
3. Sequential merge/review: run all tests, resolve schema or service contract conflicts.
4. Parallel batch 2: Lane C1 deals/commissions and Lane D dashboard shell can begin after A/B contracts merge. Lane C2 tier UI follows the tier rule contract. Lane C3 payouts begins only after commission event contract is stable.
5. Sequential finalization: Task 24-26.

### Agent instructions for every implementation subagent

- Work in an isolated git worktree or branch.
- Read this plan and only the files needed for the assigned task.
- Follow TDD where the task has behavior.
- Do not edit unrelated modules.
- Do not change schema contracts without telling the parent agent.
- Commit only the files for the assigned task.
- Return: commit SHA, files changed, tests run, unresolved concerns.

### Review gates

Every lane must pass:

1. Spec compliance review.
2. Code quality review.
3. Parent verification of git diff and tests.
4. Integration review after merge.

---

## Definition of Done

- `npm run verify` passes.
- Prisma migration and seed run from scratch.
- Public `/apply` works.
- Admin can approve an application, send agreement email, mark signed, and activate partner.
- Active partner can submit a referral.
- Duplicate referral attribution is blocked by database uniqueness.
- Admin approval controls whether referrals count.
- Partner cannot edit submitted referrals.
- Admin can create tiers and commission rules.
- Deal won creates staged commission events.
- Payout and clawback states are auditable.
- Partner dashboards show status, deals, and earnings.
- Admin dashboards show work queues.
- Audit log and notifications exist for critical transitions.
- Brand surfaces use Obsidian/Cream/Lavender correctly.

---

## Implementation Notes and Pitfalls

- Do not make referral attribution a UI-only rule. It must be enforced by `AttributionLock.key @unique`.
- Do not delete financial history. Void or add negative events.
- Do not let tier edits retroactively change historical commissions. Snapshot rules.
- Do not treat agreement sending as signature. Activation happens only after signed evidence.
- Do not over-automate legal or payout workflows in MVP. State tracking beats fragile integrations.
- Do not use Lavender for success/error alone. Pair semantic text and icon labels.
- Do not invent dashboards full of fake metrics. Show only metrics backed by data.

---

## Engineering Plan Review (plan-eng-review)

**Status:** DONE_WITH_CONCERNS, review complete and key fixes incorporated into this plan.

### Step 0: Scope Challenge

The original plan was a solid backlog, but too broad as a first implementation pass. The plan now has a P0 vertical slice cutline: application -> agreement -> activation -> referral -> attribution -> referral approval -> deal won -> commission staged -> payout paid -> audit trail.

### What already exists

```text
README.md                                   Placeholder repo readme
.gitignore                                  Basic Node/Next ignores
SUGAR & LEATHER Brand Guidelines.pdf        Brand source of truth
this plan                                   docs/plans/2026-04-29-affiliate-vendor-management-mvp.md
```

No app source, package.json, Prisma schema, or test harness exists yet.

### Architecture review findings

1. Auth cannot be chosen during implementation. It now belongs in Task 2 before schema migration.
2. The `User` model and admin bootstrap were missing. The data model now defines `User` and Task 2/5 seed admin from env.
3. Core legal/financial models were under-specified. The data model now defines Agreement, Deal, CommissionEvent, PayoutBatch, PayoutLine, QuarterlyActivitySnapshot, Notification, EmailLog, and AuditLog.
4. Referral status and attribution status were mixed. They are now separated.
5. Reusable attribution release was unsafe with a unique key. MVP now keeps first attribution immutable.
6. Email side effects needed post-commit logging. Architecture contracts now require DB log records and send-after-commit behavior.
7. Middleware-only auth was insufficient. Architecture contracts now require service-level authorization.
8. Product/package expansion needed a source of truth. The plan now includes small Product/ProductPackage tables.

### Code quality review findings

- Use the domain module pattern: `schema.ts`, `service.ts`, `queries.ts`, `types.ts`.
- Keep server actions thin.
- Centralize status transition maps.
- Add idempotency guards for agreement send, signed activation, deal won, commission staging, payout paid, and clawback.
- Preserve partner-submitted referral payloads as immutable original data. Admin corrections are separate fields or notes.
- Freeze Prisma schema before parallel agents begin.
- Build shared table/query primitives early because admin pages are table-heavy.

### Test coverage diagram

```text
CODE PATHS                                             USER FLOWS
[+] application service                                [+] Public application
  ├── submit valid application [unit + e2e]               ├── submit complete form [e2e]
  ├── duplicate email [unit]                              └── validation errors [component]
  └── audit log write [unit]

[+] agreement service                                  [+] Admin legal workflow
  ├── approve -> send [unit + email failure]              ├── approve application [e2e]
  ├── sent -> signed [unit]                               ├── send agreement [e2e]
  ├── signed -> activate [unit]                           └── activate only after signed [e2e]
  └── retry/idempotency [unit]

[+] referral/attribution service                       [+] Partner referral
  ├── normalize email/domain [unit]                       ├── submit referral [e2e]
  ├── first lock wins [Postgres integration]              ├── duplicate no-credit [e2e]
  ├── duplicate no-credit [Postgres integration]          └── partner cannot edit [e2e]
  └── admin approval count gate [unit]

[+] deal/commission/payout services                    [+] Admin revenue workflow
  ├── deal only from approved attributed referral [unit]  ├── mark deal won [e2e]
  ├── WON idempotency [unit]                              ├── staged -> payable -> paid [e2e]
  ├── commission snapshot [unit]                          └── clawback visible [e2e]
  ├── payout double-pay guard [unit]
  └── clawback additive event [unit]

[+] access control                                     [+] Cross-tenant safety
  ├── admin-only actions [unit/integration]               ├── partner denied admin [e2e]
  ├── active partner-only actions [unit/integration]      └── partner cannot read other partner [e2e]
  └── middleware + service checks [integration]
```

### Performance review findings

- All admin tables must use server-side pagination.
- Add indexes for referral, deal, commission, notification, and audit query shapes.
- Avoid N+1 reads in dashboards by using purpose-built query functions.
- Use `runtime = "nodejs"` for Prisma-backed routes/actions if deployment defaults create Edge runtime risk.
- Quarterly activity should be snapshot-based or manually generated, not recomputed across all history on every admin page load.

### Failure modes to keep covered

1. Partner activated before signature: service guard requires signed evidence.
2. Email failure hidden from staff: `EmailLog` records `FAILED` and exposes retry.
3. Duplicate referral race: unique `AttributionLock.key` and real Postgres tests.
4. Duplicate/no-credit referral counted: deal/commission services require `APPROVED` plus `FIRST_ATTRIBUTED`.
5. Deal won twice: commission staging idempotency.
6. Historical commissions rewritten by tier changes: snapshot rule fields.
7. Payout double-paid: unique `PayoutLine.commissionEventId`.
8. Clawback mutates history: use additive negative events.
9. Partner reads another partner's earnings: service-level authorization tests.
10. Public application spam: P1 rate limit/honeypot if launch exposure grows.

### Worktree parallelization review

Sequential foundation: Tasks 1-7.

Parallel after contract freeze:

- Lane A: Applications and agreements.
- Lane B: Referrals and attribution.
- Lane C1: Deals and commission service.
- Lane C2: Tier UI after rule contract.
- Lane C3: Payouts after commission event contract.
- Lane D: Dashboards/notifications/audit UI after read contracts exist.
- Lane E: E2E/docs after feature merge.

Conflict flag: no lane may edit `prisma/schema.prisma`, shared status workflows, or cross-module service signatures without parent approval.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope and strategy | 0 | NOT RUN | Optional for this product scope |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | NOT RUN | Not run |
| Eng Review | `/plan-eng-review` | Architecture and tests | 1 | DONE_WITH_CONCERNS | 12 plan patches incorporated, 10 failure modes tracked |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | NOT RUN | Recommended before frontend implementation |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | NOT RUN | Not needed before initial implementation |

- **UNRESOLVED:** none blocking plan execution. Auth library should be selected in Task 2, not deferred.
- **VERDICT:** ENG REVIEW COMPLETE WITH CONCERNS INCORPORATED. Ready to implement the P0 vertical slice with subagent-driven-development.
