import React from "react";
import Link from "next/link";

interface EditorialEmptyStateProps {
  headline: string;
  eyebrow?: string;
  body?: string;
  action?: { href: string; label: string };
  className?: string;
}

export default function EditorialEmptyState({
  headline,
  eyebrow,
  body,
  action,
  className = "",
}: EditorialEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-start gap-6 border-t border-[var(--border-dark)] py-16 ${className}`}
    >
      {eyebrow ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-[32px] leading-[1.05] text-[var(--sl-cream)]">
        {headline}
      </h2>
      {body ? (
        <p className="max-w-xl font-body text-base text-[var(--sl-silver)]">
          {body}
        </p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
        >
          <span>{action.label}</span>
          <span
            aria-hidden
            className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]"
          />
        </Link>
      ) : null}
    </div>
  );
}
