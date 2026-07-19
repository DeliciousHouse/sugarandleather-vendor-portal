# Changelog

All notable changes to the Sugar & Leather Vendor Portal are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project uses [Semantic Versioning](https://semver.org/).

## [0.3.2] - 2026-07-19

### Added
- Pull requests to `main` and pushes to `main` now run a bounded, cancellation-aware GitHub Actions quality gate with deterministic Node/npm setup.
- CI validates the Prisma schema, design-token discipline, lint, the full Vitest suite, and the production webpack build using non-secret build placeholders.
- A workflow contract test prevents source and token changes from silently bypassing the required checks.

## [0.3.1] - 2026-04-30

### Fixed
- Brand mark in the page header was rendering as a flat cream square. The original logo asset had a cream background and a dark mark — the alpha-mask generation script recolored every non-transparent pixel cream, so the entire bounding box came out solid. Regenerated with luminance thresholding (mark vs background), trimmed to bounding box, and padded square so Next.js Image's `width === height` matches the source aspect. Affects every `EditorialPageShell` page header.
- `EditorialPageShell` left an empty 4-column gutter on the right side of every page that didn't pass `sideChildren` (forms, list pages without a filter rail). The grid was always `lg:grid-cols-12` with the main column pinned at `col-span-8`, leaving 33% of the viewport unused. Now collapses to a flat full-width container when no side panel is provided.

Both regressions found by `/qa` against the local dev server and verified fixed against the running app.

## [0.3.0] - 2026-04-30

### Added
- Editorial Obsidian rolled out across the entire portal. All 18 working surfaces (admin lists + details, partner working surfaces, public apply) plus the 4 hero pages (`/`, `/login`, `/admin`, `/partner`) now share one design language.
- `EditorialFilterBar` and `EditorialPagination` primitives extracted while porting admin list screens.
- `tests/e2e/editorial-rollout.spec.ts` — public surface smoke spec covering `/`, `/login`, `/apply`. Verifies pages return 200, key editorial labels render, and there are no console errors on initial render.
- `DESIGN.md` "Approved Mockups & Implementation Status" table updated with all 22 screens. Canonical references designated for the four screen variants (list, form, detail-8/4, detail-6/6).
- `CLAUDE.md` Design system section expanded with the primitive inventory + canonical reference paths.

### Changed
- Partner working surfaces (`/partner/referrals`, `/partner/referrals/new`, `/partner/deals`, `/partner/earnings`) ported to `EditorialPageShell`. `ReferralStatusTable`, `ReferralForm`, and `EarningsTimeline` rewritten internally — call site signatures unchanged.
- Public apply (`/apply`) ported. `ApplicationForm` rewritten with `EditorialField` wrappers and mono caps section labels.
- All 8 admin list screens ported (applications, agreements, referrals, deals, payouts, audit, notifications, tiers). Status pills via `EditorialStatusPill`, filter bars via `EditorialFilterBar`, pagination via `EditorialPagination`.
- All 6 admin detail screens ported. `ApplicationReviewPanel`, `AdminReferralPanel`, `AuditLogTable`, and `NotificationList` rewritten internally to use the editorial primitives.
- `/admin/payouts/[id]/PayoutBatchActions` rewritten to use `ui/Button` (cream primary, semantic danger). Removed inline `#fff`/`#dc2626` style violations.
- `/admin/payouts/page.tsx` "Create payout batch" CTA moved out of the lavender-bg violation into the page actions slot using `ui/Button`.

### Fixed
- Cleared the token allowlist for `/admin/tiers/page.tsx` after porting away from inline hex status indicators.

### Out of scope (carried forward)
- `src/components/tiers/TierRuleEditor.tsx` retains inline hex codes for status indicators. Tracked in `scripts/.tokencheck-allowlist` for a focused follow-up PR. Used inside `/admin/tiers/[id]/page.tsx`, which is also allowlisted because it imports the editor.

## [0.2.0] - 2026-04-30

### Added
- Editorial Obsidian design system foundation. Asymmetric 8/4 grid, Cormorant Garamond display, lavender accent (max 20%), mono pagination labels, hairline rules. Documented in `DESIGN.md`.
- `src/components/brand/EditorialShell.tsx` — magazine-layout shell for marketing surfaces (`/`, `/login`).
- `src/components/brand/EditorialPageShell.tsx` — sibling shell for authenticated working pages (lists, details). Configurable 8/4 or 6/6 split, top bar with breadcrumb + actions slot.
- `src/components/brand/EditorialField.tsx` — labeled form-field wrapper. ARIA-aware. Decoupled from any form library (composes with controlled inputs, `useActionState`, or react-hook-form).
- `src/components/brand/EditorialStatusPill.tsx` — status pill using semantic color tokens. Lavender never used on status text.
- `src/components/brand/EditorialTable.tsx` — hairline-rule rows, mono headers, URL-driven sort, no zebra stripes, no rounded wrapper.
- `src/components/brand/EditorialBreadcrumb.tsx` — pagination-style breadcrumb capped at 2 levels, with dev-mode warning if exceeded.
- `src/components/brand/EditorialEmptyState.tsx` — Cormorant 32px headline + mono caption + lavender underline action.
- Eye/heart brand mark from the Sugar & Leather brand book extracted into `public/brand/logo-cream.png` and `public/brand/logo-obsidian.png`. `Logo` component now renders the actual mark with optional Courier-Prime wordmark.
- `scripts/check-tokens.sh` — token discipline gate. Flags hex codes, `font-family:` strings, lavender count above per-file cap. Wired into `npm run verify` via `npm run check:tokens`.
- `scripts/.tokencheck-allowlist` — explicit allowlist for unported pre-redesign files (cleared during phased rollout).
- Editorial Obsidian rolled out to four hero pages: `/`, `/login`, `/admin`, `/partner`.
- Local portal auth bypass for demos. Opt-in via `DISABLE_PORTAL_AUTH=true` (defaults to `false`, validated through zod). Allows running the portal without a session cookie when seeding admin/partner demo identities locally. **Production must keep `DISABLE_PORTAL_AUTH=false`.**
- 38 tests for the new editorial primitives in `tests/components/editorial-primitives.test.tsx`.
- `DESIGN.md` Primitive Inventory table + boxed Porting Recipe + loading/error/mutation/empty state spec.
- Project guidance file `CLAUDE.md`.

### Changed
- `Button.tsx` primary variant uses `--sl-cream` background (was `--sl-lavender`). Lavender is never a button background per `DESIGN.md`. Sizes now use mono caps tracking `0.32em`.
- `Badge.tsx` default tone is silver-on-silver-bg (was lavender). All variants use `rounded-sm`, mono caps, `tracking-[0.24em]`.
- `StatusPill.tsx` delegates to `EditorialStatusPill`. Existing call sites keep working.
- `Logo.tsx` rewritten to render the eye/heart mark image plus optional wordmark. Removed the hardcoded `fontFamily` string (was a `DESIGN.md` violation).

### Fixed
- `src/app/partner/page.tsx` referenced `actor.email`, which doesn't exist on `SessionUser`. Replaced with a generic "Authorized partner" footer label so the type-check passes.
