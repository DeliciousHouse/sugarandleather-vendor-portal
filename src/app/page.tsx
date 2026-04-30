import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 bg-[var(--sl-obsidian)]">
      <div className="grid w-full grid-cols-1 lg:grid-cols-12">
        {/* Editorial left — 8 cols on desktop, full width on mobile */}
        <section className="relative col-span-1 flex flex-col justify-between px-8 py-12 sm:px-16 lg:col-span-8 lg:px-24 lg:py-20">
          <header className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Sugar &amp; Leather AI
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              01 / Vendor Portal
            </span>
          </header>

          <div className="mt-24 max-w-3xl lg:mt-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-lavender)]">
              For partners and operators
            </p>

            <h1 className="mt-8 font-heading text-6xl font-bold leading-[0.95] tracking-tight text-[var(--sl-cream)] sm:text-7xl lg:text-[96px]">
              Human at the core,
              <br />
              <span className="relative inline-block">
                unbreakable
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-0 h-[3px] w-full bg-[var(--sl-lavender)]"
                />
              </span>{" "}
              under pressure
            </h1>

            <div className="mt-12 flex max-w-2xl gap-6">
              <span
                aria-hidden
                className="mt-2 h-12 w-px shrink-0 bg-[var(--sl-mist)] opacity-30"
              />
              <p className="font-body text-base leading-relaxed text-[var(--sl-silver)] sm:text-lg">
                A private workspace for the partners, resellers, and operators
                who carry Aries AI into the world. Track referrals, deals,
                commission, and payouts — without the noise of a generic SaaS
                dashboard.
              </p>
            </div>
          </div>

          <footer className="mt-24 flex flex-col gap-3 border-t border-[var(--border-dark)] pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-0">
            <p className="font-heading text-lg italic text-[var(--sl-cream)]">
              Built. Not given.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Internal use · Authorized partners
            </p>
          </footer>
        </section>

        {/* Action right — 4 cols, charcoal panel */}
        <aside className="col-span-1 flex flex-col justify-between border-t border-[var(--border-dark)] bg-[var(--sl-charcoal)] px-8 py-12 sm:px-16 lg:col-span-4 lg:border-l lg:border-t-0 lg:px-12 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              02 / Enter
            </p>
            <h2 className="mt-6 font-heading text-3xl font-normal leading-tight text-[var(--sl-cream)]">
              Two doors.
              <br />
              One workspace.
            </h2>
          </div>

          <div className="mt-16 space-y-10 lg:mt-0">
            <PortalDoor
              eyebrow="Existing partner"
              title="Sign in"
              body="Resume work in progress: live referrals, open deals, scheduled payouts."
              href="/login"
              cta="Continue to portal"
            />

            <span
              aria-hidden
              className="block h-px w-full bg-[var(--border-dark)]"
            />

            <PortalDoor
              eyebrow="New partner"
              title="Apply"
              body="A short application. We review every one ourselves — no automated funnel."
              href="/apply"
              cta="Begin application"
            />
          </div>

          <p className="mt-16 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)] lg:mt-0">
            Need help?{" "}
            <a
              href="mailto:partners@sugarandleather.ai"
              className="text-[var(--sl-cream)] underline-offset-4 hover:underline"
            >
              partners@sugarandleather.ai
            </a>
          </p>
        </aside>
      </div>
    </main>
  );
}

function PortalDoor({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-lavender)]">
        {eyebrow}
      </p>
      <h3 className="mt-3 font-heading text-4xl font-bold leading-none text-[var(--sl-cream)]">
        {title}
      </h3>
      <p className="mt-4 font-body text-sm leading-relaxed text-[var(--sl-silver)]">
        {body}
      </p>
      <Link
        href={href}
        className="group mt-6 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] transition-colors hover:text-[var(--sl-lavender)]"
      >
        <span>{cta}</span>
        <span
          aria-hidden
          className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]"
        />
      </Link>
    </div>
  );
}
