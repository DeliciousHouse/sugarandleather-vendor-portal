import React from "react";
import Logo from "./Logo";
import EditorialBreadcrumb from "./EditorialBreadcrumb";

interface EditorialPageShellProps {
  /** Top-left wordmark target. Defaults to brand logo with wordmark. */
  brand?: React.ReactNode;
  /** Section pagination label, top-right. e.g. "01 / Admin" */
  sectionLabel: string;
  /** 2-level max breadcrumb. Optional. */
  crumbs?: { label: string; href?: string }[];
  /** Mono eyebrow over the headline. */
  eyebrow?: string;
  /** Cormorant headline. ReactNode so callers can drop accent strokes. */
  headline: React.ReactNode;
  /** Single-line subhead under the headline. Use for entity IDs ("REF-0042 · Pending review"). */
  subheadline?: React.ReactNode;
  /** Right-aligned action slot in the header row. */
  actions?: React.ReactNode;
  /** Main content (left). For list pages, the table. For detail pages, the record. */
  mainChildren: React.ReactNode;
  /** Side panel (right). Filters / metadata / audit log. */
  sideChildren?: React.ReactNode;
  /** Layout split. 8/4 default; 6/6 for pages where both panels are equally dense. */
  split?: "8/4" | "6/6";
  className?: string;
}

const splitClasses: Record<"8/4" | "6/6", { main: string; side: string }> = {
  "8/4": { main: "lg:col-span-8", side: "lg:col-span-4" },
  "6/6": { main: "lg:col-span-6", side: "lg:col-span-6" },
};

export default function EditorialPageShell({
  brand,
  sectionLabel,
  crumbs,
  eyebrow,
  headline,
  subheadline,
  actions,
  mainChildren,
  sideChildren,
  split = "8/4",
  className = "",
}: EditorialPageShellProps) {
  const cols = splitClasses[split];
  return (
    <main
      className={`flex min-h-screen flex-1 flex-col bg-[var(--sl-obsidian)] ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-dark)] px-8 py-6 sm:px-16 lg:px-24">
        <div className="flex items-center gap-6">
          {brand ?? <Logo size="sm" withWordmark />}
        </div>
        <div className="flex items-center gap-6">
          {crumbs && crumbs.length > 0 ? (
            <EditorialBreadcrumb crumbs={crumbs} />
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              {sectionLabel}
            </span>
          )}
        </div>
      </header>

      <section className="px-8 py-12 sm:px-16 lg:px-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-lavender)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-4 font-heading text-4xl leading-[1.05] text-[var(--sl-cream)] sm:text-5xl">
              {headline}
            </h1>
            {subheadline ? (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                {subheadline}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-3">{actions}</div>
          ) : null}
        </div>
      </section>

      <div className="flex-1 px-8 pb-16 sm:px-16 lg:px-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className={`col-span-1 ${cols.main}`}>{mainChildren}</div>
          {sideChildren ? (
            <aside
              className={`col-span-1 ${cols.side} border-t border-[var(--border-dark)] pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0`}
            >
              {sideChildren}
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
