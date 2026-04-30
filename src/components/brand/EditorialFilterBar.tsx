import React from "react";
import Link from "next/link";

interface FilterOption {
  label: string;
  href: string;
  active: boolean;
}

interface EditorialFilterBarProps {
  options: FilterOption[];
  className?: string;
}

export default function EditorialFilterBar({
  options,
  className = "",
}: EditorialFilterBarProps) {
  return (
    <nav
      aria-label="Filter"
      className={`flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--border-dark)] pb-4 ${className}`}
    >
      {options.map((opt) => (
        <Link
          key={opt.href}
          href={opt.href}
          className={`font-mono text-[10px] uppercase tracking-[0.32em] transition-colors hover:text-[var(--sl-cream)] ${
            opt.active
              ? "text-[var(--sl-cream)]"
              : "text-[var(--sl-silver)]"
          }`}
        >
          {opt.label}
          {opt.active ? (
            <span
              aria-hidden
              className="mt-1 block h-px w-full bg-[var(--sl-cream)]"
            />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
