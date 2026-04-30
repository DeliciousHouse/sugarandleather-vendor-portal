import React from "react";
import Link from "next/link";

interface EditorialPaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}

export default function EditorialPagination({
  page,
  totalPages,
  buildHref,
  className = "",
}: EditorialPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-between border-t border-[var(--border-dark)] pt-6 ${className}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
        Page {page} / {totalPages}
      </p>
      <div className="flex items-center gap-6">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] transition-colors hover:text-[var(--sl-lavender)]"
          >
            <span aria-hidden className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]" />
            <span>Previous</span>
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] transition-colors hover:text-[var(--sl-lavender)]"
          >
            <span>Next</span>
            <span aria-hidden className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
