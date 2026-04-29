import React from "react";
import type { AdminRevenueSnapshot } from "@/domain/dashboard/queries";

function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface AdminRevenueSnapshotProps {
  snapshot: AdminRevenueSnapshot;
}

export default function AdminRevenueSnapshotPanel({ snapshot }: AdminRevenueSnapshotProps) {
  const items = [
    {
      label: "Deals won",
      value: snapshot.totalDealsWon.toLocaleString(),
      color: "var(--sl-cream)",
    },
    {
      label: "Total revenue",
      value: formatCents(snapshot.totalRevenueCents, snapshot.currency),
      color: "var(--status-success-text)",
    },
    {
      label: "Total commissions",
      value: formatCents(snapshot.totalCommissionCents, snapshot.currency),
      color: "var(--sl-lavender)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.75rem",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--sl-silver)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              color: item.color,
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
