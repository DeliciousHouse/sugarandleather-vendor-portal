import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-8 text-[var(--sl-cream)]">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border-dark)] bg-[var(--surface-panel)] p-8 shadow-2xl">
        <p className="font-body text-xs uppercase tracking-[0.2em] text-[var(--sl-lavender)]">
          Sugar &amp; Leather AI
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold leading-none text-[var(--sl-cream)]">
          Vendor portal access
        </h1>
        <p className="mt-4 font-body text-sm leading-6 text-[var(--sl-silver)]">
          Authentication is scaffolded for the MVP foundation. Partner activation and the final credential provider are wired in the next implementation lane.
        </p>
        <div className="mt-6 rounded-lg border border-[var(--border-dark)] bg-[rgba(237,232,225,0.04)] p-4 font-body text-sm text-[var(--sl-silver)]">
          Admin and partner sessions use the signed app-owned session cookie contract in this foundation. No password form is enabled yet.
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-[var(--sl-lavender)] px-5 font-body text-sm font-medium text-[var(--sl-obsidian)] transition-opacity hover:opacity-90"
        >
          Back to portal home
        </Link>
      </section>
    </main>
  );
}
