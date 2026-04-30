import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPayoutBatches, getPayableEvents } from "@/domain/payouts/queries";
import StatusPill from "@/components/ui/StatusPill";
import { promoteToPayableAction, createPayoutBatchAction } from "./[id]/actions";

export const dynamic = "force-dynamic";

const BATCH_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PROCESSING: "Processing",
  PAID: "Paid",
  VOIDED: "Voided",
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminPayoutsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const [batches, payableEvents] = await Promise.all([
    getAdminPayoutBatches(
      prisma as unknown as Parameters<typeof getAdminPayoutBatches>[0]
    ),
    getPayableEvents(
      prisma as unknown as Parameters<typeof getPayableEvents>[0]
    ),
  ]);

  const totalPayable = payableEvents.reduce((sum, e) => sum + e.amountCents, 0);

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
            Payouts
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Stage payable commissions, create payout batches, and manage clawbacks.
          </p>
        </div>

        {/* Payable events summary */}
        {payableEvents.length > 0 && (
          <div
            style={{
              padding: "1.25rem 1.5rem",
              backgroundColor: "var(--surface-panel)",
              border: "1px solid var(--border-dark)",
              borderRadius: "0.75rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--sl-silver)",
                  marginBottom: "0.25rem",
                }}
              >
                Payable commissions ready for batching
              </div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--sl-cream)",
                }}
              >
                {formatCents(totalPayable, "USD")}{" "}
                <span style={{ fontSize: "0.9375rem", color: "var(--sl-silver)", fontFamily: "var(--font-body)" }}>
                  across {payableEvents.length} event{payableEvents.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <form action={createPayoutBatchAction}>
              <input
                type="hidden"
                name="eventIds"
                value={JSON.stringify(payableEvents.map((e) => e.id))}
              />
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--sl-lavender)",
                  color: "var(--sl-obsidian)",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Create Payout Batch ({payableEvents.length})
              </button>
            </form>
          </div>
        )}

        {/* Promote to payable action */}
        <div
          style={{
            padding: "1rem 1.5rem",
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.75rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--sl-silver)" }}>
            Move eligible staged commissions (past their payout delay) to{" "}
            <span style={{ color: "var(--sl-cream)" }}>Payable</span> status.
          </p>
          <form action={promoteToPayableAction}>
            <button
              type="submit"
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "var(--sl-lavender)",
                border: "1px solid var(--border-dark)",
                borderRadius: "0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Promote Staged → Payable
            </button>
          </form>
        </div>

        {/* Payable events table */}
        {payableEvents.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--sl-cream)",
                marginBottom: "1rem",
              }}
            >
              Payable Events
            </h2>
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
                    {["Partner", "Deal", "Kind", "Tier", "Amount", "Eligible Since"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "var(--sl-silver)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payableEvents.map((event, i) => (
                    <tr
                      key={event.id}
                      style={{
                        backgroundColor:
                          i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                        borderBottom: "1px solid var(--border-dark)",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                        {event.partnerId}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--sl-silver)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {event.dealId.slice(-8)}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--sl-cream)" }}>
                        {event.kind}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                        {event.tierNameSnapshot}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--sl-cream)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCents(event.amountCents, event.currency)}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          color: "var(--sl-silver)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(event.payoutEligibleAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payout batches */}
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "var(--sl-cream)",
            marginBottom: "1rem",
          }}
        >
          Payout Batches
        </h2>
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
                {["ID", "Status", "Lines", "Currency", "Created", "Paid", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--sl-silver)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      color: "var(--sl-mid-gray)",
                    }}
                  >
                    No payout batches yet.
                  </td>
                </tr>
              ) : (
                batches.map((batch, i) => (
                  <tr
                    key={batch.id}
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                      borderBottom: "1px solid var(--border-dark)",
                    }}
                  >
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--sl-silver)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {batch.id.slice(-8)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusPill
                        status={batch.status}
                        label={BATCH_STATUS_LABELS[batch.status] ?? batch.status}
                      />
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                      {batch._count.lines}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                      {batch.currency}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--sl-silver)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--sl-silver)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {batch.paidAt ? new Date(batch.paidAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link
                        href={`/admin/payouts/${batch.id}`}
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
