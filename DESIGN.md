# Design System — Sugar & Leather Vendor Portal

This is the design source of truth. Read before any visual or UI change. Every choice traces back to the Sugar & Leather AI Brand Guidelines (`SUGAR & LEATHER Brand Guidelines.pdf`). Don't deviate without explicit approval.

## Product Context

- **What this is:** Internal vendor + affiliate portal for Sugar & Leather AI's Aries product line. Partner onboarding, referral attribution, deal tracking, commission staging, payouts.
- **Who it's for:** Two audiences in one app. Partners (affiliates, resellers — running their own businesses) and internal admins (the S&L team approving applications, signing agreements, releasing payouts).
- **Project type:** Authenticated B2B web app. Some marketing surface (the public landing + apply funnel).
- **Tone of the brand:** Executive coaching firm. Not a tech startup. Luxury restraint. "Human at the core, unbreakable under pressure." Closer to a private members' club than to Stripe Dashboard.

## The Memorable Thing

When a partner lands on this product, the one thing they should remember is: **this was made by people who took it seriously.** Editorial weight, restrained palette, generous breathing room. Not another SaaS dashboard with a logo bolted on.

Every design decision below is in service of that single feeling.

## Aesthetic Direction

- **Direction:** Editorial Obsidian — a luxury editorial / private-club aesthetic adapted to a B2B workspace.
- **Decoration level:** **Minimal.** Typography and spacing do all the work. No decorative gradients, no purple blobs, no illustrations of abstract shapes, no icon-in-circle feature grids, no glassmorphism.
- **Mood:** Low-key, considered, quietly authoritative. Chiaroscuro — subjects emerge from shadow, never pasted on top. Leather jacket energy. Toughness worn lightly.
- **Reference posture:** Think the inside of a hardcover book, the lobby of a high-end coaching practice, the print spread of a magazine that respects its reader. Not Linear, not Vercel, not Stripe.

## Typography

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` and exposed as CSS variables. Never reference fonts by name in components — always use the variable.

| Role | Font | CSS variable | Usage |
|------|------|--------------|-------|
| Display / Hero | Cormorant Garamond Bold | `var(--font-heading)` | Page headlines, marketing hero, modal titles. 48–96px. |
| Subhead / Section title | Cormorant Garamond Regular OR body sans at 2x | `var(--font-heading)` or `var(--font-body)` | Editorial subheads use Cormorant. UI section titles use body sans. |
| Body | Inter (Helvetica Neue stand-in for web) | `var(--font-body)` | All running text, form labels, table cells. 14–18px. |
| Eyebrow / Metadata / Pagination | Courier Prime | `var(--font-mono)` | All-caps, tracking 0.32em, 11px. The editorial signal. |
| Code & Technical | Courier Prime | `var(--font-mono)` | Code blocks, IDs, API references. |

**Headline rules** (from the brand book):
- Sentence case, **without** punctuation. "Human at the core, unbreakable under pressure" — no period.
- Tight leading (`leading-[0.95]` to `leading-none`).
- 3x body size or larger. The hero on the landing is 96px. Page-level headlines are 40–56px. Modal titles are 28–32px.

**Body rules:**
- Sentence case, with punctuation. Normal sentences end in periods.
- Color: `var(--sl-mid-gray)` on Cream, `var(--sl-silver)` on Obsidian. Never Cream-on-Obsidian for body — it's reserved for headlines.
- Line length cap: ~70ch. Long-form copy gets a `max-w-2xl` container.

**Eyebrow / metadata pattern (the editorial tell):**
```
font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]
```
Use for: section labels ("01 / Enter"), category tags, "Last updated" timestamps, status pill text, footer attribution. This is what makes the product feel editorial instead of SaaS.

**Banned:** Inter as a display font. Bold sans-serif headlines. ALL-CAPS HEADLINES. Punctuation at end of headlines.

## Color

Values live in `src/styles/tokens.css`. Never hardcode hex in components.

### Brand palette (do not extend)

| Token | Hex | Role |
|-------|-----|------|
| `--sl-obsidian` | `#0E0C0F` | **Primary background.** Black with a purple undertone — never use `#000`. |
| `--sl-cream` | `#EDE8E1` | Headlines on dark, primary background on light surfaces. |
| `--sl-charcoal` | `#2C2830` | Large panels on top of Obsidian (sidebars, action panels, modals). |
| `--sl-deep-plum` | `#3D3347` | Hover states on Charcoal panels, subtle section separators on dark. |
| `--sl-lavender` | `#C5B8D4` | **Accent only. Max 20% of any composition. Aim for under 5% in most views.** Subheads on Obsidian, eyebrow categories, single underline emphasis. **Never** as a primary button background. **Never** as a success/error indicator. |
| `--sl-mid-gray` | `#6B6570` | Body text on Cream. Caption text. |
| `--sl-silver` | `#A8A5AE` | Body text on Obsidian. Icons. Metadata. |
| `--sl-warm-white` | `#F7F4F0` | Large panels on top of Cream. |
| `--sl-mist` | `#D8D3DE` | Divider lines on Cream, subtle separators. |

### Status palette (semantic, not brand)

The brand book is silent on success/warning/error. We extend with desaturated, brand-coherent tones — already defined in `tokens.css` as `--status-*`. **Lavender is never used to communicate status.**

### Light vs dark surfaces

- **Default** (authenticated app, public landing): Obsidian background. This is the brand's home.
- **Long-form reading** (partner agreements, legal copy, printable invoices): Cream background with Mid Gray body. Reserved for documents, not navigation.

The whole app should not be 50/50 light and dark. Default to Obsidian; switch to Cream surfaces only when reading is the primary task.

## Spacing

- **Base unit:** 4px. Tailwind spacing scale (`gap-2`, `p-4`, etc.) maps directly.
- **Density:** **Spacious.** Editorial breathing room is part of the brand. Pages use `py-20` or `py-24` on desktop. Sections inside cards get `p-8` minimum. If a layout looks dense, it's wrong.
- **Page horizontal padding:** `px-8` mobile, `px-16` tablet, `px-24` desktop on marketing surfaces. Authenticated app pages can use `px-12` on desktop (more content density allowed once a partner is logged in and working).
- **Section rhythm:** Eyebrow → headline → body → action. Use `mt-3` between eyebrow and headline, `mt-4` between headline and body, `mt-6` to the action.

## Layout

- **Approach:** Asymmetric editorial for marketing/landing surfaces. Disciplined 12-column grid for authenticated app pages.
- **Grid:** 12-column. Marketing surfaces favor 8/4 or 7/5 splits. App pages favor 9/3 (content + sidebar).
- **Max content width:** 1440px. Long-form text capped at 70ch.
- **Border radius:** **Sparing.** Cards: `rounded-md` (6px). Inputs: `rounded-sm` (2px). Buttons: `rounded-sm`. **Never** `rounded-full` for non-icon elements. **Never** uniform bubble-radius across everything — that's the AI slop signal.

## Composition primitives (the skill of the brand)

These are the moves that make the product feel like Sugar & Leather instead of generic dark-mode SaaS. Use them throughout.

### 1. Editorial pagination labels

`01 / Section Name` in mono uppercase. Top-of-page on the left, current-section indicator on the right. Replaces breadcrumbs on marketing surfaces. On app pages, used as section dividers between major regions.

### 2. The hairline rule

`<span className="h-px w-full bg-[var(--border-dark)]" />` between sections. On Cream, use `bg-[var(--sl-mist)]`. Never use a heavier border. Never use shadow as a section separator.

### 3. The vertical hairline + indented body

A 12-tall, 1px-wide silver-at-30%-opacity bar to the left of pull quotes and feature paragraphs. Lifted from print editorial. Used on the landing for the mission paragraph.

### 4. The animated underline link

```
<Link className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em]">
  <span>Continue</span>
  <span className="h-px w-10 bg-current transition-all group-hover:w-16" />
</Link>
```

The hairline grows on hover. This is our primary "tertiary" call to action — used everywhere a subtle link would go in a normal SaaS. It's also our default secondary CTA on marketing.

### 5. Button hierarchy (only three)

- **Primary** (rare on marketing, common in app): Cream background, Obsidian text. `bg-[var(--sl-cream)] text-[var(--sl-obsidian)]`. Used for the single most important action on a screen.
- **Secondary**: hairline border, transparent fill, Cream text. `border border-[var(--border-dark)] text-[var(--sl-cream)]`.
- **Tertiary** (the editorial link): the animated underline link above.

**No** lavender background buttons. **No** gradient buttons. **No** filled colored buttons except the primary cream-on-obsidian. If you need a third color, you've designed a fourth button — go back.

### 6. The single accent stroke

Lavender appears as a 3px underline beneath one word in a headline, a single eyebrow label, or a single hover-state hairline. Never a fill. Never a button. Never more than one lavender element per visible region.

## Motion

- **Approach:** Minimal-functional. No scroll-driven choreography. No entrance animations on page load. No spring physics.
- **Allowed:** opacity transitions on hover (`transition-opacity`), color transitions on links (`transition-colors`), width transitions on the underline-link hairline (`transition-all`). Durations 150–250ms. Easing `ease-out`.
- **Banned:** parallax, scroll-driven reveals, decorative loops, animated gradients, anything that says "look at the website."

## Imagery

The brand book is explicit:
- Low-key, dramatic. Dark backgrounds. One strong light source. Chiaroscuro.
- Real leaders. No stock-photo smiles. Stillness and quiet confidence.
- Desaturated, near-monochrome. Occasional warm leather brown as accent.
- Asymmetric composition. Generous breathing room.

For the portal, **prefer no photography over wrong photography.** A typographic page is more on-brand than a stock photo. If imagery is added (eg. partner profile avatars on the admin Coach Network screen), it must follow the brand's photography rules and route through approval.

## Logo

- `src/components/brand/Logo.tsx` renders the eye/heart mark (extracted from the brand book) plus the optional Courier-Prime mono wordmark.
- Mark assets: `public/brand/logo-cream.png` (cream on transparent — for Obsidian backgrounds) and `public/brand/logo-obsidian.png` (dark on transparent — for Cream backgrounds). Use Cream on Obsidian, Obsidian on Cream — never the other way, never a third color.
- Use `<Logo size="sm" withWordmark />` in page headers; mark-only at `lg` for hero placement.
- Clear space: 1/2× the logo's height on every side. Never crop into clear space.
- Banned: rotation, mirroring, opacity changes, gradients, strokes, drop shadows, boxes, multiple colors. (Brand book pages 7–8.)

## Primitive Inventory (Editorial Obsidian)

Lives at `src/components/brand/`. Reach for these in this order before reinventing.

| Primitive | When | Notes |
|-----------|------|-------|
| `EditorialPageShell` | Every authenticated page (lists + details). | Top bar w/ logo + breadcrumb, Cormorant headline area, configurable 8/4 or 6/6 main+side split. |
| `EditorialShell` | Marketing-style landing surfaces only (`/`, `/login`). | Magazine layout. Don't use for working surfaces. |
| `EditorialTable` | Data lists with hairline-rule rows + URL-driven sort. | Replaces inline `<table>` everywhere. Status pills via `EditorialStatusPill`. |
| `EditorialField` | Form inputs. | Layout wrapper around any `<input>`/`<select>`/`<textarea>`. Not coupled to react-hook-form — caller spreads its own controlled or `register(…)` props onto the child input. |
| `EditorialStatusPill` | Status text in queues, detail headers. | **Lavender never appears here.** Semantic `--status-*` tokens at reduced opacity. |
| `EditorialBreadcrumb` | Page header navigation. | Hard-capped at 2 levels. Entity IDs go in a separate `subheadline` slot, not the breadcrumb. |
| `EditorialEmptyState` | Empty queue or "no records" body block. | Cormorant 32px headline + mono caption + optional lavender-underline action. |

### Common props (all primitives)

- `className?: string` — escape hatch for layout positioning. Don't use it to override colors or fonts.
- Where primitives have a labeled section, they accept `eyebrow?: string` rendered as `font-mono text-[11px] uppercase tracking-[0.32em]`.

## Porting Recipe — One Screen

Use this checklist any time you port `src/app/<route>/page.tsx`:

1. **Identify variant.** List, detail, or form? Pick `EditorialPageShell` (list + detail) or `EditorialShell` (marketing landing).
2. **Swap the shell.** Replace existing `<main>`/`<section>` wrapping with the chosen primitive. Pass `sectionLabel="<NN> / <Section>"` and a 2-level `crumbs` array if nested.
3. **Swap the table** (list pages). Replace inline `<table>` or `DataTable` with `EditorialTable`. Build `ColumnDef<T>[]` server-side. Sort lives in URL params, not client state.
4. **Swap status pills.** Replace `<StatusPill>` with `<EditorialStatusPill>` — same prop API, but the visual is now hairline-bordered mono caps with semantic color tokens. Lavender NEVER on status text.
5. **Swap form fields** (form pages). Wrap each input in `<EditorialField label="…" htmlFor="…">` and pass the input element as children. The wrapper sets `id`, `aria-required`, `aria-invalid`, `aria-describedby` on the child automatically.
6. **Verify locally.** `npm run check:tokens && npm run lint && npm run test && npx next build --webpack`. Eyeball the lavender count in your diff — cap is 6 hits per file (8 for `EditorialShell` itself).

The first list screen ported in Phase B becomes THE canonical reference for all subsequent list screens. Same for the first detail screen in Phase D. Update the Approved Mockups table below when each canonical reference lands.

## Loading / error / mutation / empty states

- **Loading:** hairline-rule rows, alternating silver bars at 40% / 60% width with `animate-pulse`. No Cormorant in skeleton (skeletons should not set typographic expectations). Background remains `--sl-obsidian`.
- **Error:** mono uppercase "Something went wrong" + animated-underline retry link. No red card, no icon, no badge.
- **Empty:** `EditorialEmptyState` (Cormorant 32px headline + mono caption + lavender underline on the action link).
- **In-flight mutation:** disable the button (cream bg → 30% opacity), label swaps to mono `Processing…` in silver. No spinner overlay.
- **Optimistic update:** N/A. We're server-action + revalidate. Do not reach for client-side optimistic state without explicit reason in PR description.

## Accessibility

- Cream on Obsidian: AAA at body size.
- Silver on Obsidian: AA at body size, AAA at large. Acceptable for body but stop here — do not push to lighter grays for hierarchy. Use size, weight, and spacing instead.
- Lavender on Obsidian: AA at large only. **Never** use Lavender for body or important UI text. Eyebrow-size only.
- Focus rings: `outline 2px solid var(--sl-lavender)` with `outline-offset: 2px`. Already wired in `globals.css`.

## Anti-slop checklist

If your design has any of these, it's wrong:

- [ ] Centered hero with a pill button floating in space
- [ ] Lavender as a button background
- [ ] 3-column feature grid with icons in colored circles
- [ ] Gradient accents (purple, blue, anything)
- [ ] Uniform `rounded-2xl` or `rounded-full` on every element
- [ ] Sans-serif headlines
- [ ] Headlines with periods at the end
- [ ] Generic stock photography
- [ ] Glassmorphism / blur backdrops
- [ ] Decorative blob shapes behind content
- [ ] "Built for X" / "Designed for Y" marketing copy patterns
- [ ] Animated entrance on page load
- [ ] More than one lavender element in a single region

## Approved Mockups

Visual reference for screens that haven't been implemented yet. All approved via `/design-shotgun`. Same compositional signature across every screen: asymmetric 8/4 split, 80–96px Cormorant hero with one lavender-underlined keyword, mono `01/` and `02/` pagination labels, hairline rules, "Built. Not given." footer, mono underline-link CTAs, no card chrome, no metric grids.

| Screen | Approved file |
|--------|---------------|
| Public landing | Implemented in `src/app/page.tsx` (the template all other screens follow) |
| Admin dashboard | `~/.gstack/projects/sugar-and-leather-AI-sugar-and-leather-vendor-portal/designs/admin-dashboard-20260429/variant-D.png` |
| Partner dashboard | `~/.gstack/projects/sugar-and-leather-AI-sugar-and-leather-vendor-portal/designs/partner-dashboard-20260429/variant-A.png` |
| Login | `~/.gstack/projects/sugar-and-leather-AI-sugar-and-leather-vendor-portal/designs/login-20260429/variant-A.png` |

**Translating mockups to code.** AI mockups occasionally render headlines with end punctuation, render typos, or skip the lavender underline. These are model artifacts, not design intent. When implementing in TSX:
- Strip end-of-headline periods (brand rule: sentence case, no end punctuation).
- Render the lavender 3px underline manually under one keyword in the hero, exactly as `src/app/page.tsx` does for the word "unbreakable".
- Use real content (real partner names, real deal IDs, real amounts via tabular-nums) — never lorem ipsum.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-29 | Initial design system written | Public landing felt generic. Brand was set up in tokens but not expressed in composition. New direction: editorial obsidian — typography + restraint, not decoration. |
| 2026-04-29 | Public `src/app/page.tsx` redesigned | Asymmetric 8/4 split, Cormorant 96px hero, mission as pull quote, Lavender restricted to a single underline + two eyebrow labels. Replaces centered-pill layout. |
| 2026-04-29 | Admin / partner / login mockups approved via `/design-shotgun` | Round 1 (Broadsheet / Quiet command center / Two-pane workspace) explored layout posture. User picked the home page's energy as the template. Round 2 generated a single home-translated admin variant (D) plus matching partner + login variants. All three approved. Same signature across every screen. |
