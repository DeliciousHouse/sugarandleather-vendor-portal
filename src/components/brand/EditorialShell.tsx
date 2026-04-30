import React from "react";
import Link from "next/link";

type EditorialShellProps = {
  topLeftLabel: string;
  topRightLabel: string;
  eyebrow: string;
  headline: React.ReactNode;
  body?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: string;
  rightLabel: string;
  rightHeadline: string;
  rightChildren: React.ReactNode;
  rightFooter?: { href: string; label: string };
};

export default function EditorialShell({
  topLeftLabel,
  topRightLabel,
  eyebrow,
  headline,
  body,
  footerLeft,
  footerRight,
  rightLabel,
  rightHeadline,
  rightChildren,
  rightFooter,
}: EditorialShellProps) {
  return (
    <main className="flex min-h-screen flex-1 bg-[var(--sl-obsidian)]">
      <div className="grid w-full grid-cols-1 lg:grid-cols-12">
        <section className="relative col-span-1 flex flex-col justify-between px-8 py-12 sm:px-16 lg:col-span-8 lg:px-24 lg:py-20">
          <header className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              {topLeftLabel}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              {topRightLabel}
            </span>
          </header>

          <div className="mt-24 max-w-3xl lg:mt-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-lavender)]">
              {eyebrow}
            </p>
            <h1 className="mt-8 font-heading text-5xl font-bold leading-[0.95] tracking-tight text-[var(--sl-cream)] sm:text-6xl lg:text-[80px]">
              {headline}
            </h1>
            {body ? (
              <div className="mt-12 flex max-w-2xl gap-6">
                <span
                  aria-hidden
                  className="mt-2 h-12 w-px shrink-0 bg-[var(--sl-mist)] opacity-30"
                />
                <div className="font-body text-base leading-relaxed text-[var(--sl-silver)] sm:text-lg">
                  {body}
                </div>
              </div>
            ) : null}
          </div>

          <footer className="mt-24 flex flex-col gap-3 border-t border-[var(--border-dark)] pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-0">
            <p className="font-heading text-lg italic text-[var(--sl-cream)]">
              {footerLeft ?? "Built. Not given."}
            </p>
            {footerRight ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                {footerRight}
              </p>
            ) : null}
          </footer>
        </section>

        <aside className="col-span-1 flex flex-col justify-between border-t border-[var(--border-dark)] bg-[var(--sl-charcoal)] px-8 py-12 sm:px-16 lg:col-span-4 lg:border-l lg:border-t-0 lg:px-12 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              {rightLabel}
            </p>
            <h2 className="mt-6 font-heading text-3xl font-bold leading-tight text-[var(--sl-cream)]">
              {rightHeadline}
            </h2>
            <span
              aria-hidden
              className="mt-6 block h-px w-full bg-[var(--border-dark)]"
            />
          </div>

          <div className="mt-10 flex-1 lg:mt-0">{rightChildren}</div>

          {rightFooter ? (
            <div className="mt-10 lg:mt-0">
              <span
                aria-hidden
                className="block h-px w-full bg-[var(--border-dark)]"
              />
              <Link
                href={rightFooter.href}
                className="group mt-8 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] transition-colors hover:text-[var(--sl-lavender)]"
              >
                <span>{rightFooter.label}</span>
                <span
                  aria-hidden
                  className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]"
                />
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

const SMALL_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
  "Twenty",
];

export function spellOrNumber(n: number, opts: { capitalize?: boolean } = {}) {
  if (n >= 0 && n <= 20) {
    const word = SMALL_WORDS[n];
    return opts.capitalize ? word : word.toLowerCase();
  }
  return n.toLocaleString("en-US");
}

export function pluralize(n: number, singular: string, plural?: string) {
  return n === 1 ? singular : plural ?? `${singular}s`;
}

export function QueueRow({
  category,
  title,
  meta,
}: {
  category: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="border-b border-[var(--border-dark)] py-5 last:border-b-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
        {category}
      </p>
      <p className="mt-2 font-heading text-2xl font-normal leading-tight text-[var(--sl-cream)]">
        {title}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {meta}
      </p>
    </div>
  );
}

export function EmptyQueueRow({ note }: { note: string }) {
  return (
    <div className="py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {note}
      </p>
    </div>
  );
}

export function AccentSection({
  eyebrow,
  eyebrowAccent = false,
  children,
}: {
  eyebrow: string;
  eyebrowAccent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--border-dark)] py-6 last:border-b-0">
      <p
        className={`font-mono text-[11px] uppercase tracking-[0.32em] ${
          eyebrowAccent ? "text-[var(--sl-lavender)]" : "text-[var(--sl-silver)]"
        }`}
      >
        {eyebrow}
      </p>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
