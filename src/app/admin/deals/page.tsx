import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminDeals } from "@/domain/deals/queries";
import StatusPill from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
  CANCELLED: "Cancelled",
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminDealsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const deals = await getAdminDeals(
    prisma as unknown as Parameters<typeof getAdminDeals>[0]
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
            Deals
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Track deal status and trigger commission staging on won deals.
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
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--sl-obsidian)",
                  borderBottom: "1px solid var(--border-dark)",
                }}
              >
                {[
                  "Partner",
                  "Product",
                  "Amount",
                  "Status",
                  "Closed",
                  "CRM ID",
                  "",
                ].map((h) => (
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
              {deals.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      color: "var(--sl-mid-gray)",
                    }}
                  >
                    No deals yet.
                  </td>
                </tr>
              ) : (
                deals.map((deal, i) => (
                  <tr
                    key={deal.id}
                    style={{
                      backgroundColor:
                        i % 2 === 0
                          ? "var(--surface-panel)"
                          : "var(--sl-charcoal)",
                      borderBottom: "1px solid var(--border-dark)",
                    }}
                  >
                    <td
                      style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}
                    >
                      {deal.partnerId}
                    </td>
                    <td
                      style={{ padding: "0.75rem 1rem", color: "var(--sl-cream)" }}
                    >
                      <div style={{ fontWeight: 500 }}>{deal.productCode}</div>
                      {deal.packageCode && (
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--sl-silver)",
                          }}
                        >
                          {deal.packageCode}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--sl-cream)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCents(deal.amountCents, deal.currency)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusPill
                        status={deal.status}
                        label={STATUS_LABELS[deal.status] ?? deal.status}
                      />
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--sl-silver)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {deal.closedAt
                        ? new Date(deal.closedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--sl-silver)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {deal.externalCrmId ?? "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link
                        href={`/admin/deals/${deal.id}`}
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--sl-lavender)",
                          textDecoration: "none",
                        }}
                      >
                        View →
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
