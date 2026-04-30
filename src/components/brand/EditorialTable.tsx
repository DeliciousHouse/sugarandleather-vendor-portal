import React from "react";
import Link from "next/link";

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface EditorialTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey?: (row: T, idx: number) => string;
  activeSortKey?: string;
  activeSortDir?: "asc" | "desc";
  buildSortHref?: (key: string, nextDir: "asc" | "desc") => string;
  className?: string;
}

export default function EditorialTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "Nothing here yet.",
  rowKey,
  activeSortKey,
  activeSortDir,
  buildSortHref,
  className = "",
}: EditorialTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--border-dark)]">
            {columns.map((col) => {
              const isActive = activeSortKey === col.key;
              const nextDir: "asc" | "desc" =
                isActive && activeSortDir === "asc" ? "desc" : "asc";
              const headerInner = (
                <span
                  className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] ${
                    isActive
                      ? "text-[var(--sl-cream)]"
                      : "text-[var(--sl-silver)]"
                  }`}
                >
                  {col.header}
                  {isActive ? (
                    <span aria-hidden className="text-[var(--sl-silver)]">
                      {activeSortDir === "asc" ? "↑" : "↓"}
                    </span>
                  ) : null}
                </span>
              );
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`relative px-4 py-3 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  aria-sort={
                    isActive
                      ? activeSortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : col.sortable
                        ? "none"
                        : undefined
                  }
                >
                  {col.sortable && buildSortHref ? (
                    <Link
                      href={buildSortHref(col.key, nextDir)}
                      className="hover:text-[var(--sl-cream)]"
                    >
                      {headerInner}
                    </Link>
                  ) : (
                    headerInner
                  )}
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-px left-0 h-px w-full bg-[var(--sl-cream)]"
                    />
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                className="border-b border-[var(--border-dark)] last:border-b-0 hover:bg-[var(--sl-charcoal)]/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-4 font-body text-sm text-[var(--sl-cream)] ${
                      col.align === "right" ? "text-right tabular-nums" : ""
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, React.ReactNode>)[col.key] ??
                        null)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
