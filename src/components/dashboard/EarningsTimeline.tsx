import React from "react";
import type { PartnerEarningsRow, PartnerEarningsSummary } from "@/domain/dashboard/queries";

const STATUS_LABELS: Record<string, string> = {
  STAGED: "Staged",
  PAYABLE: "Payable",
  PAID: "Paid",
  CLAWED_BACK: "Clawed back",
  VOIDED: "Voided",
};

const KIND_LABELS: Record<string, string> = {
  UPFRONT: "Upfront",
  TRAILING: "Trailing",
  CLAWBACK: "Clawback",
  ADJUSTMENT: "Adjustment",
};

const statusColor: Record<string, string> = {
  STAGED: "var(--status-warning-text)",
  PAYABLE: "var(--sl-lavender)",
  PAID: "var(--status-success-text)",
  CLAWED_BACK: "var(--status-danger-text)",
  VOIDED: "var(--sl-mid-gray)",
};

function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

interface EarningsTimelineProps {
  events: PartnerEarningsRow[];
  summary: PartnerEarningsSummary;
}

const SUMMARY_ITEMS: Array<{ key: keyof Omit<PartnerEarningsSummary, "currency">; label: string }> = [
  { key: "STAGED", label: "Staged" },
  { key: "PAYABLE", label: "Payable" },
  { key: "PAID", label: "Paid" },
  { key: "CLAWED_BACK", label: "Clawed back" },
];

export default function EarningsTimeline({ events, summary }: EarningsTimelineProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Summary grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
        }}
      >
        {SUMMARY_ITEMS.map(({ key, label }) => (
          <div
            key={key}
            style={{
              backgroundColor: "var(--surface-panel)",
              border: "1px solid var(--border-dark)",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--sl-silver)",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                color: statusColor[key] ?? "var(--sl-cream)",
              }}
            >
              {formatCents(summary[key], summary.currency)}
            </span>
          </div>
        ))}
      </div>

      {/* Payout timing note */}
      <div
        style={{
          backgroundColor: "var(--accent-bg-subtle)",
          border: "1px solid var(--accent-border-subtle)",
          borderRadius: "0.5rem",
          padding: "0.875rem 1.125rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
        }}
      >
        <p style={{ fontSize: "0.875rem", color: "var(--sl-cream)", fontWeight: 500 }}>
          Payout timing
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--sl-silver)", lineHeight: 1.6 }}>
          Commissions move from <strong style={{ color: "var(--status-warning-text)" }}>Staged</strong> to{" "}
          <strong style={{ color: "var(--sl-lavender)" }}>Payable</strong> once the delay window specified in your
          agreement has passed. Your admin will process payments on the eligible date shown below.
          Commissions may be subject to clawback within the window defined in your agreement terms.
        </p>
      </div>

      {/* Events table */}
      {events.length === 0 ? (
        <p style={{ color: "var(--sl-mid-gray)", fontSize: "0.9375rem", textAlign: "center", padding: "2rem 0" }}>
          No commission events yet.
        </p>
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
                {["Type", "Status", "Amount", "Tier", "Eligible date", "Paid date"].map((h) => (
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
              {events.map((event, i) => (
                <tr
                  key={event.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                    borderBottom: "1px solid var(--border-dark)",
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", color: "var(--sl-cream)" }}>
                    {KIND_LABELS[event.kind] ?? event.kind}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ color: statusColor[event.status] ?? "var(--sl-silver)", fontWeight: 500 }}>
                      {STATUS_LABELS[event.status] ?? event.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      color: event.status === "CLAWED_BACK" ? "var(--status-danger-text)" : "var(--sl-cream)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {event.status === "CLAWED_BACK" ? "−" : ""}
                    {formatCents(event.amountCents, event.currency)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                    {event.tierNameSnapshot}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)", fontVariantNumeric: "tabular-nums" }}>
                    {event.payoutEligibleAt.toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)", fontVariantNumeric: "tabular-nums" }}>
                    {event.paidAt ? event.paidAt.toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
