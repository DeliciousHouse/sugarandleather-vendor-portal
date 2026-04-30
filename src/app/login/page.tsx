import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 bg-[var(--sl-obsidian)]">
      <div className="grid w-full grid-cols-1 lg:grid-cols-12">
        {/* Editorial left — 8 cols on desktop */}
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
              Welcome back
            </p>

            <h1 className="mt-8 font-heading text-6xl font-bold leading-[0.95] tracking-tight text-[var(--sl-cream)] sm:text-7xl lg:text-[88px]">
              A quiet workspace where your work{" "}
              <span className="relative inline-block">
                waits
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-0 h-[3px] w-full bg-[var(--sl-lavender)]"
                />
              </span>{" "}
              for you
            </h1>

            <div className="mt-12 flex max-w-2xl gap-6">
              <span
                aria-hidden
                className="mt-2 h-12 w-px shrink-0 bg-[var(--sl-mist)] opacity-30"
              />
              <p className="font-body text-base leading-relaxed text-[var(--sl-silver)] sm:text-lg">
                No notifications, no badges, no inboxes screaming at you. Sign
                in and see only the deals, referrals, and payouts that actually
                need your attention.
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

        {/* Form right — 4 cols, charcoal panel */}
        <aside className="col-span-1 flex flex-col justify-between border-t border-[var(--border-dark)] bg-[var(--sl-charcoal)] px-8 py-12 sm:px-16 lg:col-span-4 lg:border-l lg:border-t-0 lg:px-12 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              02 / Sign in
            </p>
            <h2 className="mt-6 font-heading text-4xl font-bold leading-tight text-[var(--sl-cream)]">
              Sign in
            </h2>
            <span
              aria-hidden
              className="mt-6 block h-px w-full bg-[var(--border-dark)]"
            />
          </div>

          <form className="mt-10 space-y-8 lg:mt-0" aria-describedby="auth-status">
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
            />

            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              trailing={
                <Link
                  href="#"
                  className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)] underline-offset-4 hover:text-[var(--sl-cream)] hover:underline"
                >
                  Forgot?
                </Link>
              }
            />

            <button
              type="submit"
              disabled
              className="inline-flex h-12 w-full items-center justify-center bg-[var(--sl-cream)] font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--sl-obsidian)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>

            <p
              id="auth-status"
              className="font-mono text-[11px] leading-relaxed uppercase tracking-[0.24em] text-[var(--sl-silver)]"
            >
              Password sign-in wires up in the next lane. Sessions today come
              from the signed app-owned cookie contract or local bypass.
            </p>
          </form>

          <div className="mt-16 lg:mt-0">
            <span
              aria-hidden
              className="block h-px w-full bg-[var(--border-dark)]"
            />
            <div className="mt-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-lavender)]">
                New partner
              </p>
              <h3 className="mt-3 font-heading text-3xl font-bold leading-none text-[var(--sl-cream)]">
                Apply for the network
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-[var(--sl-silver)]">
                Reviewed individually. No automated funnel.
              </p>
              <Link
                href="/apply"
                className="group mt-6 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] transition-colors hover:text-[var(--sl-lavender)]"
              >
                <span>Begin application</span>
                <span
                  aria-hidden
                  className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]"
                />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  trailing,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]"
        >
          {label}
        </label>
        {trailing}
      </div>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-3 block w-full border-0 border-b border-[rgba(237,232,225,0.25)] bg-transparent px-0 pb-3 pt-1 font-body text-base text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:border-[var(--sl-lavender)] focus:outline-none focus:ring-0"
      />
    </div>
  );
}
