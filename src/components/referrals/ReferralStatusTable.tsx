import React from "react";
import StatusPill from "@/components/ui/StatusPill";

export type ReferralRow = {
  id: string;
  leadName: string;
  leadEmail?: string | null;
  leadCompany?: string | null;
  country?: string | null;
  attributionStatus: "FIRST_ATTRIBUTED" | "DUPLICATE_NO_CREDIT";
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED" | "LOST";
  submittedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
  LOST: "Lost",
  FIRST_ATTRIBUTED: "Attributed",
  DUPLICATE_NO_CREDIT: "Duplicate — no credit",
};

type Props = {
  referrals: ReferralRow[];
};

export default function ReferralStatusTable({ referrals }: Props) {
  if (referrals.length === 0) {
    return (
      <div
        style={{
          padding: "3rem 1rem",
          textAlign: "center",
          color: "var(--sl-mid-gray)",
          fontSize: "0.9375rem",
        }}
      >
        No referrals submitted yet.
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "0.75rem",
        border: "1px solid var(--border-dark)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr
            style={{
              backgroundColor: "var(--sl-obsidian)",
              borderBottom: "1px solid var(--border-dark)",
            }}
          >
            {["Lead", "Company", "Country", "Attribution", "Status", "Submitted"].map(
              (header) => (
                <th
                  key={header}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "var(--sl-silver)",
                    letterSpacing: "0.025em",
                  }}
                >
                  {header}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {referrals.map((row, i) => (
            <tr
              key={row.id}
              style={{
                backgroundColor:
                  i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                borderBottom: "1px solid var(--border-dark)",
              }}
            >
              <td style={{ padding: "0.75rem 1rem", color: "var(--sl-cream)" }}>
                <div style={{ fontWeight: 500 }}>{row.leadName}</div>
                {row.leadEmail && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--sl-silver)" }}>
                    {row.leadEmail}
                  </div>
                )}
              </td>
              <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                {row.leadCompany ?? "—"}
              </td>
              <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                {row.country ?? "—"}
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <StatusPill
                  status={row.attributionStatus}
                  label={STATUS_LABELS[row.attributionStatus] ?? row.attributionStatus}
                />
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <StatusPill
                  status={row.status}
                  label={STATUS_LABELS[row.status] ?? row.status}
                />
              </td>
              <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)", whiteSpace: "nowrap" }}>
                {new Date(row.submittedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
