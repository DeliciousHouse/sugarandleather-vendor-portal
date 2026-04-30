# Manual Smoke Checklist — Sugar & Leather Vendor Portal

Run this before any release candidate or after significant UI changes. Check each item manually in a browser against a seeded local or staging environment.

---

## Setup

- [ ] `docker compose up -d` (Postgres running)
- [ ] `npm run db:migrate && npm run db:seed` (fresh schema + seed data)
- [ ] `npm run dev` (dev server up at `http://localhost:3000`)
- [ ] Confirm seed created: one admin user, one submitted application, one active partner, demo referrals

---

## 1. Brand and visual baseline

- [ ] Root (`/`) redirects appropriately (login or dashboard)
- [ ] Background is Obsidian `#0E0C0F` on all dark surfaces
- [ ] Cream `#EDE8E1` used for primary text on dark backgrounds
- [ ] Lavender `#C5B8D4` used for accents, status highlights, and active buttons — never as a background fill on large areas
- [ ] No hardcoded hex colors visible in DevTools computed styles on UI components (all values should resolve through `var(--sl-*)` tokens)
- [ ] Cormorant Garamond loaded for all `h1`/`h2` headings
- [ ] Inter/Helvetica used for body and label text

---

## 2. Keyboard navigation — `/apply` (public)

- [ ] Tab order flows top-to-bottom through all form sections
- [ ] Each `<input>` and `<textarea>` shows a visible lavender focus ring when focused via keyboard
- [ ] Checkbox labels in "Promotion channels" are focusable and toggle on Space
- [ ] Submit button is reachable by Tab and activates on Enter/Space
- [ ] Focus ring is visible against the Obsidian background (lavender outline, 2px, offset 2px)
- [ ] Error alert (`role="alert"`) is announced on invalid submission (test with VoiceOver/NVDA if available)

---

## 3. Keyboard navigation — Partner dashboard (`/partner`)

- [ ] "View all referrals →" link shows focus ring and navigates on Enter
- [ ] "My deals" and "My earnings" card links show lavender ring-2 focus outline on keyboard focus
- [ ] Metric cards are not focusable (they are not interactive) — correct behavior
- [ ] Tab skips non-interactive elements and reaches nav links only

### Partner referrals (`/partner/referrals`)

- [ ] Referral table is keyboard scrollable (horizontal scroll via Shift+Tab or scroll keys on focused container)
- [ ] "Submit new referral" button (if present) is reachable and focusable

### New referral form (`/partner/referrals/new`)

- [ ] All inputs show lavender focus ring
- [ ] Required-field error messages appear inline after submit attempt
- [ ] Submit button disabled state is visually distinct (40% opacity)

---

## 4. Keyboard navigation — Admin queues

### Admin dashboard (`/admin`)

- [ ] Work queue cards (ApplicationsPending, AgreementsPending, etc.) show lavender ring focus when tabbed
- [ ] Revenue snapshot items are non-interactive — correct
- [ ] Audit log table scrolls horizontally on narrow viewports without overflowing the page

### Admin applications (`/admin/applications`)

- [ ] Status filter nav links are all keyboard-focusable
- [ ] Active filter link is visually distinct (accent background)
- [ ] Table "Review →" links show focus ring and navigate on Enter
- [ ] Pagination links (Previous / Next) are reachable by keyboard

### Admin application detail (`/admin/applications/[id]`)

- [ ] "Admin notes" textarea shows focus ring
- [ ] Action buttons (Mark in review, Approve, Reject) are focusable and show lavender ring
- [ ] Reject button is disabled until notes are entered — confirm it cannot be activated by keyboard when disabled

### Admin referrals (`/admin/referrals`)

- [ ] Referral rows and action links are keyboard-navigable

---

## 5. Mobile layout — viewport 375px (iPhone SE)

Resize to 375px wide or use DevTools device emulation.

### `/apply`

- [ ] Form stacks to single column (no side-by-side fields)
- [ ] Promotion channel checkboxes stack to single column
- [ ] Submit button is full-width or right-aligned and not clipped
- [ ] No horizontal scroll on the page

### Partner dashboard (`/partner`)

- [ ] Metric cards reflow to 2-up or 1-up grid (no overflow)
- [ ] "My deals" and "My earnings" nav cards stack vertically
- [ ] "View all referrals →" link is legible and tappable

### Admin dashboard (`/admin`)

- [ ] Work queue cards reflow to 1-up or 2-up grid
- [ ] Audit log table scrolls horizontally within its container; page does not scroll horizontally

### Admin applications (`/admin/applications`)

- [ ] Header ("Applications" + total count) wraps gracefully on narrow screens
- [ ] Filter nav pills wrap to multiple rows
- [ ] Table scrolls horizontally within its container

---

## 6. Focus rings — Obsidian and Cream surfaces

- [ ] On Obsidian background: lavender focus ring is clearly visible (high contrast)
- [ ] On Charcoal panel background (`var(--surface-panel)`): lavender ring is visible with the `ring-offset-[var(--sl-obsidian)]` gap
- [ ] Button focus ring: 2px lavender ring with 2px offset on Obsidian background
- [ ] Input focus ring: 2px lavender outline with 2px offset
- [ ] Link card focus ring: 2px lavender ring with `border-radius: 0.75rem` matching card shape

---

## 7. Status pills and badges

- [ ] SUBMITTED / PENDING_REVIEW → neutral (silver)
- [ ] IN_REVIEW / SENT → warning (amber)
- [ ] APPROVED / ACTIVE / SIGNED / PAID / WON → success (green)
- [ ] REJECTED / CANCELLED / LOST → danger (red)
- [ ] Default (unrecognized status) → accent/lavender pill
- [ ] Pills are legible at mobile font sizes (12px)

---

## 8. Admin action flows (happy path)

- [ ] Admin can mark an application "In review"
- [ ] Admin can approve an application (advances to APPROVED_PENDING_AGREEMENT)
- [ ] Admin can reject an application with notes (notes required — verify disabled state enforced)
- [ ] Agreement send and signed confirmation flows are accessible via admin agreements page
- [ ] Admin can approve a referral from the referral detail page

---

## 9. Accessibility spot-checks (automated assist)

Run `npx @axe-core/cli http://localhost:3000/apply` (requires axe CLI) and confirm:
- [ ] No critical or serious violations on `/apply`
- [ ] No critical or serious violations on `/partner` (authenticated)
- [ ] No critical or serious violations on `/admin` (authenticated)

Expected acceptable findings: color-contrast warnings on mid-gray text (by design per brand); no missing labels, no missing alt text, no missing roles.

---

## 10. Regression — partner cannot edit referrals

- [ ] Submitted referral detail page (partner view) shows read-only data
- [ ] No edit form, edit button, or save action is accessible from `/partner/referrals`

---

## Sign-off

| Area | Tester | Date | Pass/Fail | Notes |
|------|--------|------|-----------|-------|
| Brand/visual | | | | |
| Keyboard nav | | | | |
| Mobile layout | | | | |
| Focus rings | | | | |
| Status pills | | | | |
| Admin flows | | | | |
| Axe scan | | | | |
| Referral immutability | | | | |
