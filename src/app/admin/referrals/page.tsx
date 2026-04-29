import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminReferrals } from "@/domain/referrals/queries";
import StatusPill from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
  LOST: "Lost",
  FIRST_ATTRIBUTED: "First attributed",
  DUPLICATE_NO_CREDIT: "Duplicate — no credit",
};

export default async function AdminReferralsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const referrals = await getAdminReferrals(
    prisma as unknown as Parameters<typeof getAdminReferrals>[0]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            Referral queue
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Review and approve referrals. Duplicate/no-credit referrals cannot be approved as counting.
          </p>
        </div>

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
                {["Lead", "Partner", "Attribution", "Status", "Submitted", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--sl-silver)",
                      letterSpacing: "0.025em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      color: "var(--sl-mid-gray)",
                    }}
                  >
                    No referrals yet.
                  </td>
                </tr>
              ) : (
                referrals.map((row, i) => (
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
                      {row.partnerId}
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
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link
                        href={`/admin/referrals/${row.id}`}
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--sl-lavender)",
                          textDecoration: "none",
                        }}
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
