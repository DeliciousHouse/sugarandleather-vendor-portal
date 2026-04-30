import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialField from "@/components/brand/EditorialField";
import AuditLogTable from "@/components/audit/AuditLogTable";
import Button from "@/components/ui/Button";
import { AUDIT_ENTITY_TYPES, getAdminAuditLogs } from "@/domain/audit/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit log · Admin · Sugar & Leather",
};

const inputClass =
  "w-full bg-transparent py-2 font-body text-base text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:outline-none";

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

  const logs = await getAdminAuditLogs({
    entityType: entityTypeFilter,
    actorId: actorIdFilter,
  });

  const filterActive = !!(entityTypeFilter || actorIdFilter);

  return (
    <EditorialPageShell
      sectionLabel="02 / Audit log"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Audit" },
      ]}
      eyebrow="Compliance trail"
      headline={`${logs.length} ${logs.length === 1 ? "event" : "events"}`}
      subheadline={
        filterActive
          ? `Filtered${entityTypeFilter ? ` · ${entityTypeFilter}` : ""}${actorIdFilter ? ` · ${actorIdFilter}` : ""}`
          : "Every state change is recorded"
      }
      mainChildren={
        <div className="flex flex-col gap-8">
          <form
            method="get"
            className="grid grid-cols-1 gap-8 border-b border-[var(--border-dark)] pb-8 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
          >
            <EditorialField label="Entity type" htmlFor="entityType">
              <select
                name="entityType"
                defaultValue={entityTypeFilter ?? ""}
                className={inputClass}
              >
                <option value="">All entities</option>
                {AUDIT_ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </EditorialField>
            <EditorialField label="Actor ID" htmlFor="actorId">
              <input
                name="actorId"
                type="text"
                defaultValue={actorIdFilter ?? ""}
                placeholder="user_…"
                className={inputClass}
              />
            </EditorialField>
            <Button type="submit" size="sm">
              Filter
            </Button>
            {filterActive ? (
              <a
                href="/admin/audit"
                className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-silver)] hover:text-[var(--sl-cream)] transition-colors"
              >
                Clear
              </a>
            ) : null}
          </form>

          <AuditLogTable
            rows={logs}
            emptyMessage="No audit events match the current filters."
          />
        </div>
      }
    />
  );
}
