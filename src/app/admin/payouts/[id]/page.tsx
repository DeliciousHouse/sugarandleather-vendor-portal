import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPayoutBatchById } from "@/domain/payouts/queries";
import StatusPill from "@/components/ui/StatusPill";
import PayoutBatchActions from "./PayoutBatchActions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

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
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function cellStyle(color = "var(--sl-cream)"): React.CSSProperties {
  return { padding: "0.75rem 1rem", color };
}

export default async function AdminPayoutBatchPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const batch = await getAdminPayoutBatchById(
    prisma as unknown as Parameters<typeof getAdminPayoutBatchById>[0],
    id
  );

  if (!batch) {
    notFound();
  }

  const totalCents = batch.lines.reduce((sum, l) => sum + l.amountCents, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <Link
          href="/admin/payouts"
          style={{
            fontSize: "0.875rem",
            color: "var(--sl-silver)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "1.5rem",
          }}
        >
          ← Payouts
        </Link>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--sl-cream)",
                marginBottom: "0.375rem",
              }}
            >
              Payout Batch
            </h1>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                color: "var(--sl-mid-gray)",
                marginBottom: "0.5rem",
              }}
            >
              {batch.id}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <StatusPill
                status={batch.status}
                label={BATCH_STATUS_LABELS[batch.status] ?? batch.status}
              />
              <span style={{ fontSize: "0.875rem", color: "var(--sl-silver)" }}>
                {batch.lines.length} line{batch.lines.length !== 1 ? "s" : ""} ·{" "}
                {formatCents(totalCents, batch.currency)}
              </span>
              {batch.paidAt && (
                <span style={{ fontSize: "0.875rem", color: "var(--sl-silver)" }}>
                  Paid {new Date(batch.paidAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {batch.notes && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--sl-silver)",
                  marginTop: "0.5rem",
                }}
              >
                {batch.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          {batch.status !== "PAID" && batch.status !== "VOIDED" && (
            <PayoutBatchActions batchId={batch.id} batchStatus={batch.status} />
          )}
        </div>

        {/* Lines table */}
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-dark)",
            marginBottom: "2rem",
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
                {["Partner", "Commission Event", "Amount", "Clawback"].map((h) => (
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
              {batch.lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      color: "var(--sl-mid-gray)",
                    }}
                  >
                    No lines in this batch.
                  </td>
                </tr>
              ) : (
                batch.lines.map((line, i) => (
                  <tr
                    key={line.id}
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                      borderBottom: "1px solid var(--border-dark)",
                    }}
                  >
                    <td style={cellStyle("var(--sl-silver)")}>{line.partnerId}</td>
                    <td
                      style={{
                        ...cellStyle("var(--sl-silver)"),
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {line.commissionEventId}
                    </td>
                    <td
                      style={{
                        ...cellStyle(),
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCents(line.amountCents, line.currency)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {batch.status === "PAID" && (
                        <PayoutBatchActions
                          batchId={batch.id}
                          batchStatus={batch.status}
                          clawbackEventId={line.commissionEventId}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total row */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--border-dark)",
          }}
        >
          <span style={{ color: "var(--sl-silver)", fontSize: "0.875rem" }}>
            Total
          </span>
          <span
            style={{
              color: "var(--sl-cream)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCents(totalCents, batch.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
