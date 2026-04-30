import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center px-8">
      <div className="max-w-xl space-y-6 text-center">
        <h1 className="font-heading text-5xl font-bold leading-none tracking-tight text-[var(--sl-cream)]">
          Sugar &amp; Leather
        </h1>
        <p className="font-heading text-2xl font-normal leading-none text-[var(--sl-lavender)]">
          Vendor Portal
        </p>
        <p className="mx-auto max-w-sm font-body text-sm leading-relaxed text-[var(--sl-silver)]">
          Internal affiliate and vendor management. Sign in to access your partner dashboard or admin controls.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-sm bg-[var(--sl-lavender)] px-6 font-body text-sm font-medium text-[var(--sl-obsidian)] transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
          <span className="inline-flex h-10 items-center rounded-sm border border-[var(--border-dark)] px-6 font-body text-sm text-[var(--sl-silver)]">
            Application intake next
          </span>
        </div>
      </div>
    </main>
  );
}
