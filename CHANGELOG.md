# Changelog

All notable changes to the Sugar & Leather Vendor Portal are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project uses [Semantic Versioning](https://semver.org/).

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
