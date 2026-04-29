import React from "react";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import {
  getAdminDashboardWorkQueueCounts,
  getAdminDashboardRecentAuditEvents,
  getAdminDashboardRevenueSnapshot,
} from "@/domain/dashboard/queries";
import AdminWorkQueue from "@/components/dashboard/AdminWorkQueue";
import AdminRevenueSnapshotPanel from "@/components/dashboard/AdminRevenueSnapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Admin — Sugar & Leather",
};

export default async function AdminDashboardPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const [counts, snapshot, auditEvents] = await Promise.all([
    getAdminDashboardWorkQueueCounts(),
    getAdminDashboardRevenueSnapshot(),
    getAdminDashboardRecentAuditEvents(),
  ]);

  return (
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-6xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            Admin overview
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Work queues and revenue at a glance.
          </p>
        </div>

        {/* Work queue */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--sl-cream)",
              letterSpacing: "0.01em",
            }}
          >
            Work queue
          </h2>
          <AdminWorkQueue counts={counts} />
        </section>

        {/* Revenue snapshot */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--sl-cream)",
              letterSpacing: "0.01em",
            }}
          >
            Revenue snapshot
          </h2>
          <AdminRevenueSnapshotPanel snapshot={snapshot} />
        </section>

        {/* Recent audit events */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--sl-cream)",
              letterSpacing: "0.01em",
            }}
          >
            Recent activity
          </h2>
          {auditEvents.length === 0 ? (
            <p style={{ fontSize: "0.9375rem", color: "var(--sl-mid-gray)" }}>No recent activity.</p>
          ) : (
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid var(--border-dark)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--sl-obsidian)", borderBottom: "1px solid var(--border-dark)" }}>
                    {["Action", "Entity", "Actor", "When"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "var(--sl-silver)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((event, i) => (
                    <tr
                      key={event.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                        borderBottom: "1px solid var(--border-dark)",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", color: "var(--sl-cream)" }}>
                        {event.action}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                        <span style={{ fontWeight: 500 }}>{event.entityType}</span>{" "}
                        <span style={{ fontSize: "0.8125rem", opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
                          {event.entityId.slice(0, 8)}…
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                        {event.actorId ? (
                          <span style={{ fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums" }}>
                            {event.actorId.slice(0, 8)}…
                          </span>
                        ) : (
                          <span style={{ color: "var(--sl-mid-gray)" }}>
                            {event.actorType === "SYSTEM" ? "System" : "—"}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--sl-silver)",
                          fontSize: "0.8125rem",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {event.createdAt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

