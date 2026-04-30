import React from "react";
import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

interface EditorialBreadcrumbProps {
  crumbs: Crumb[];
  className?: string;
}

const MAX_LEVELS = 2;

export default function EditorialBreadcrumb({
  crumbs,
  className = "",
}: EditorialBreadcrumbProps) {
  if (process.env.NODE_ENV !== "production" && crumbs.length > MAX_LEVELS) {
    console.warn(
      `EditorialBreadcrumb: more than ${MAX_LEVELS} crumbs passed (${crumbs.length}). Trimming. Use a separate eyebrow for entity IDs.`,
    );
  }
  const display = crumbs.slice(0, MAX_LEVELS);
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)] ${className}`}
    >
      {display.map((crumb, idx) => {
        const isLast = idx === display.length - 1;
        const numbered = `${String(idx + 1).padStart(2, "0")} / ${crumb.label}`;
        return (
          <span key={`${crumb.label}-${idx}`} className="flex items-center">
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="hover:text-[var(--sl-cream)] transition-colors"
              >
                {numbered}
              </Link>
            ) : (
              <span
                className={isLast ? "text-[var(--sl-cream)]" : undefined}
                aria-current={isLast ? "page" : undefined}
              >
                {numbered}
              </span>
            )}
            {!isLast ? (
              <span aria-hidden className="mx-3 text-[var(--sl-silver)]/50">
                ·
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
