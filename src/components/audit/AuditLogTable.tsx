import React from "react";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";

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
  after: Record<string, unknown> | null,
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
      changes.push(
        `${key}: ${JSON.stringify(prev) ?? "–"} → ${JSON.stringify(next) ?? "–"}`,
      );
    }
  }

  if (changes.length === 0) return "No field changes";
  if (changes.length <= 3) return changes.join(", ");
  return `${changes.slice(0, 3).join(", ")} + ${changes.length - 3} more`;
}

const columns: ColumnDef<AuditLogRow & Record<string, unknown>>[] = [
  {
    key: "createdAt",
    header: "Timestamp",
    render: (row) => (
      <time
        dateTime={new Date(row.createdAt).toISOString()}
        className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]"
      >
        {new Date(row.createdAt).toLocaleString()}
      </time>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    render: (row) =>
      row.actorType === "SYSTEM" ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-mid-gray)]">
          system
        </span>
      ) : (
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
          {row.actorId ?? "—"}
        </span>
      ),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-cream)]">
        {row.action}
      </span>
    ),
  },
  {
    key: "entity",
    header: "Entity",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[var(--sl-cream)]">{row.entityType}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
          {row.entityId}
        </span>
      </div>
    ),
  },
  {
    key: "diff",
    header: "Changes",
    render: (row) => (
      <details className="group max-w-md">
        <summary className="cursor-pointer list-none text-sm text-[var(--sl-silver)] hover:text-[var(--sl-cream)]">
          {diffSummary(row.before, row.after)}
        </summary>
        {row.before || row.after ? (
          <pre className="mt-3 max-w-md overflow-x-auto whitespace-pre-wrap break-all border border-[var(--border-dark)] p-3 font-mono text-[11px] leading-relaxed text-[var(--sl-silver)]">
            {JSON.stringify(
              { before: row.before, after: row.after },
              null,
              2,
            )}
          </pre>
        ) : null}
      </details>
    ),
  },
  {
    key: "reason",
    header: "Reason",
    render: (row) => (
      <span className="text-sm text-[var(--sl-mid-gray)]">
        {row.reason ?? "—"}
      </span>
    ),
  },
];

export default function AuditLogTable({
  rows,
  emptyMessage = "No audit events.",
}: AuditLogTableProps) {
  return (
    <EditorialTable
      columns={columns}
      data={rows as (AuditLogRow & Record<string, unknown>)[]}
      rowKey={(row) => row.id}
      emptyMessage={emptyMessage}
    />
  );
}
