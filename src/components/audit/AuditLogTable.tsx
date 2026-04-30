import React from "react";

export type AuditLogRow = {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  createdAt: Date;
};

interface AuditLogTableProps {
  rows: AuditLogRow[];
  emptyMessage?: string;
}

function diffSummary(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string {
  if (!before && !after) return "—";

  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  const changes: string[] = [];
  for (const key of keys) {
    const prev = before?.[key];
    const next = after?.[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      changes.push(`${key}: ${JSON.stringify(prev) ?? "–"} → ${JSON.stringify(next) ?? "–"}`);
    }
  }

  if (changes.length === 0) return "No field changes";
  if (changes.length <= 3) return changes.join(", ");
  return `${changes.slice(0, 3).join(", ")} + ${changes.length - 3} more`;
}

export default function AuditLogTable({
  rows,
  emptyMessage = "No audit events.",
}: AuditLogTableProps) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "0.75rem",
        border: "1px solid var(--border-dark)",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "var(--sl-obsidian)",
              borderBottom: "1px solid var(--border-dark)",
            }}
          >
            {["Timestamp", "Actor", "Action", "Entity", "Changes", "Reason"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "var(--sl-silver)",
                    letterSpacing: "0.025em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "3rem 1rem",
                  textAlign: "center",
                  color: "var(--sl-mid-gray)",
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  backgroundColor:
                    i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                  borderBottom: "1px solid var(--border-dark)",
                  verticalAlign: "top",
                }}
              >
                {/* Timestamp */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    color: "var(--sl-silver)",
                    whiteSpace: "nowrap",
                    fontSize: "0.8125rem",
                  }}
                >
                  <time dateTime={new Date(row.createdAt).toISOString()}>
                    {new Date(row.createdAt).toLocaleString()}
                  </time>
                </td>

                {/* Actor */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    color: "var(--sl-cream)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.actorType === "SYSTEM" ? (
                    <span style={{ color: "var(--sl-mid-gray)" }}>system</span>
                  ) : (
                    row.actorId ?? "—"
                  )}
                </td>

                {/* Action */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    color: "var(--sl-lavender)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.action}
                </td>

                {/* Entity */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    color: "var(--sl-cream)",
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{row.entityType}</div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--sl-mid-gray)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {row.entityId}
                  </div>
                </td>

                {/* Changes — diff summary + disclosure */}
                <td style={{ padding: "0.75rem 1rem", maxWidth: "24rem" }}>
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "var(--sl-silver)",
                        fontSize: "0.8125rem",
                        listStyle: "none",
                        lineHeight: 1.5,
                      }}
                    >
                      {diffSummary(row.before, row.after)}
                    </summary>
                    {(row.before || row.after) && (
                      <pre
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.75rem",
                          backgroundColor: "var(--sl-obsidian)",
                          borderRadius: "0.375rem",
                          border: "1px solid var(--border-dark)",
                          color: "var(--sl-silver)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          overflowX: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {JSON.stringify({ before: row.before, after: row.after }, null, 2)}
                      </pre>
                    )}
                  </details>
                </td>

                {/* Reason */}
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    color: "var(--sl-mid-gray)",
                    fontSize: "0.8125rem",
                  }}
                >
                  {row.reason ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
