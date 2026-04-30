import React from "react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data",
  className = "",
}: DataTableProps<T>) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border ${className}`}
      style={{ borderColor: "var(--border-dark)" }}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr
            style={{
              backgroundColor: "var(--sl-obsidian)",
              borderBottom: "1px solid var(--border-dark)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-semibold tracking-wide"
                style={{ color: "var(--sl-silver)" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center"
                style={{ color: "var(--sl-mid-gray)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor:
                    rowIndex % 2 === 0
                      ? "var(--surface-panel)"
                      : "var(--sl-charcoal)",
                  borderBottom: "1px solid var(--border-dark)",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3"
                    style={{ color: "var(--sl-cream)" }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
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
