import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import AuditLogTable from "@/components/audit/AuditLogTable";
import { AUDIT_ENTITY_TYPES, getAdminAuditLogs } from "@/domain/audit/queries";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; actorId?: string }>;
}) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const entityTypeFilter = params.entityType?.trim() || undefined;
  const actorIdFilter = params.actorId?.trim() || undefined;

  const logs = await getAdminAuditLogs({ entityType: entityTypeFilter, actorId: actorIdFilter });

  const filterBannerParts: string[] = [];
  if (entityTypeFilter) filterBannerParts.push(`entity type: ${entityTypeFilter}`);
  if (actorIdFilter) filterBannerParts.push(`actor: ${actorIdFilter}`);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            Audit Log
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Every admin state change is recorded here for compliance and
            investigation.
          </p>
        </div>

        {/* Filters */}
        <form
          method="get"
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label
              htmlFor="entityType"
              style={{ fontSize: "0.8125rem", color: "var(--sl-silver)" }}
            >
              Entity type
            </label>
            <select
              id="entityType"
              name="entityType"
              defaultValue={entityTypeFilter ?? ""}
              style={{
                backgroundColor: "var(--surface-panel)",
                border: "1px solid var(--border-dark)",
                borderRadius: "0.375rem",
                color: "var(--sl-cream)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                minWidth: "12rem",
              }}
            >
              <option value="">All entities</option>
              {AUDIT_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label
              htmlFor="actorId"
              style={{ fontSize: "0.8125rem", color: "var(--sl-silver)" }}
            >
              Actor ID
            </label>
            <input
              id="actorId"
              name="actorId"
              type="text"
              defaultValue={actorIdFilter ?? ""}
              placeholder="user_…"
              style={{
                backgroundColor: "var(--surface-panel)",
                border: "1px solid var(--border-dark)",
                borderRadius: "0.375rem",
                color: "var(--sl-cream)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                width: "14rem",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: "var(--sl-lavender)",
              color: "var(--sl-obsidian)",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Filter
          </button>

          {(entityTypeFilter || actorIdFilter) && (
            <a
              href="/admin/audit"
              style={{
                fontSize: "0.875rem",
                color: "var(--sl-mid-gray)",
                textDecoration: "none",
                alignSelf: "center",
              }}
            >
              Clear filters
            </a>
          )}
        </form>

        {/* Active filter banner */}
        {filterBannerParts.length > 0 && (
          <p
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "var(--sl-lavender)",
            }}
          >
            Showing results for {filterBannerParts.join(" and ")} — {logs.length} event
            {logs.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Table */}
        <AuditLogTable rows={logs} emptyMessage="No audit events match the current filters." />
      </div>
    </div>
  );
}
