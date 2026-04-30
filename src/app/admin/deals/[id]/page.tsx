import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminDealById } from "@/domain/deals/queries";
import StatusPill from "@/components/ui/StatusPill";
import Button from "@/components/ui/Button";
import { updateDealStatusAction } from "./actions";
import type { UpdateDealInput } from "@/domain/deals/service";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
  CANCELLED: "Cancelled",
};

const COMMISSION_KIND_LABELS: Record<string, string> = {
  UPFRONT: "Upfront",
  TRAILING: "Trailing",
  CLAWBACK: "Clawback",
  ADJUSTMENT: "Adjustment",
};

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  STAGED: "Staged",
  PAYABLE: "Payable",
  PAID: "Paid",
  VOIDED: "Voided",
  CLAWED_BACK: "Clawed back",
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function cellStyle(
  color = "var(--sl-cream)"
): React.CSSProperties {
  return { padding: "0.75rem 1rem", color };
}

function StatusTransitionForm({
  dealId,
  targetStatus,
  label,
  variant,
}: {
  dealId: string;
  targetStatus: "WON" | "LOST" | "CANCELLED";
  label: string;
  variant: "primary" | "secondary" | "danger";
}) {
  async function transition(formData: FormData) {
    "use server";
    const lostReason = formData.get("lostReason") as string | null;
    const input: UpdateDealInput = { dealId, status: targetStatus };
    if (targetStatus === "LOST" && lostReason) {
      input.lostReason = lostReason;
    }
    const result = await updateDealStatusAction(input);
    if (result.ok) {
      redirect("/admin/deals");
    }
  }

  return (
    <form action={transition} style={{ display: "inline" }}>
      {targetStatus === "LOST" && (
        <input
          name="lostReason"
          placeholder="Reason (optional)"
          style={{
            backgroundColor: "var(--surface-root)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.4rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.875rem",
            marginRight: "0.5rem",
          }}
        />
      )}
      <Button type="submit" variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}

export default async function AdminDealDetailPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const deal = await getAdminDealById(
    prisma as unknown as Parameters<typeof getAdminDealById>[0],
    id
  );

  if (!deal) notFound();

  const isOpen = deal.status === "OPEN";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            href="/admin/deals"
            style={{
              fontSize: "0.875rem",
              color: "var(--sl-lavender)",
              textDecoration: "none",
            }}
          >
            ← Back to deals
          </Link>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--sl-cream)",
            marginBottom: "1.5rem",
          }}
        >
          Deal
        </h1>

        {/* Deal details panel */}
        <div
          style={{
            backgroundColor: "var(--surface-panel)",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-dark)",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Field label="Partner ID" value={deal.partnerId} />
          <Field label="Referral ID" value={deal.referralId} />
          <Field label="Product" value={deal.productCode} />
          {deal.packageCode && (
            <Field label="Package" value={deal.packageCode} />
          )}
          <Field
            label="Amount"
            value={formatCents(deal.amountCents, deal.currency)}
          />
          <Field
            label="Status"
            value={
              <StatusPill
                status={deal.status}
                label={STATUS_LABELS[deal.status] ?? deal.status}
              />
            }
          />
          {deal.closedAt && (
            <Field
              label="Closed"
              value={new Date(deal.closedAt).toLocaleDateString()}
            />
          )}
          {deal.externalCrmId && (
            <Field label="CRM ID" value={deal.externalCrmId} mono />
          )}
          {deal.lostReason && (
            <Field label="Lost reason" value={deal.lostReason} />
          )}
        </div>

        {/* Status actions */}
        {isOpen && (
          <div
            style={{
              backgroundColor: "var(--surface-panel)",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-dark)",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--sl-silver)",
                marginRight: "0.25rem",
              }}
            >
              Transition:
            </span>
            <StatusTransitionForm
              dealId={deal.id}
              targetStatus="WON"
              label="Mark WON"
              variant="primary"
            />
            <StatusTransitionForm
              dealId={deal.id}
              targetStatus="LOST"
              label="Mark LOST"
              variant="secondary"
            />
            <StatusTransitionForm
              dealId={deal.id}
              targetStatus="CANCELLED"
              label="Cancel"
              variant="danger"
            />
          </div>
        )}

        {/* Commission events */}
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--sl-cream)",
            marginBottom: "0.75rem",
          }}
        >
          Commission events
        </h2>
        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid var(--border-dark)",
            overflowX: "auto",
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
                  "Kind",
                  "Status",
                  "Amount",
                  "Tier",
                  "Rule",
                  "Period",
                  "Eligible",
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
              {deal.commissionEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "var(--sl-mid-gray)",
                    }}
                  >
                    No commission events yet. Mark deal WON to stage commissions.
                  </td>
                </tr>
              ) : (
                deal.commissionEvents.map((ev, i) => (
                  <tr
                    key={ev.id}
                    style={{
                      backgroundColor:
                        i % 2 === 0
                          ? "var(--surface-panel)"
                          : "var(--sl-charcoal)",
                      borderBottom: "1px solid var(--border-dark)",
                    }}
                  >
                    <td style={cellStyle()}>
                      {COMMISSION_KIND_LABELS[ev.kind] ?? ev.kind}
                    </td>
                    <td style={cellStyle()}>
                      <StatusPill
                        status={ev.status}
                        label={
                          COMMISSION_STATUS_LABELS[ev.status] ?? ev.status
                        }
                      />
                    </td>
                    <td style={cellStyle()}>
                      {formatCents(ev.amountCents, ev.currency)}
                    </td>
                    <td style={cellStyle("var(--sl-silver)")}>
                      {ev.tierNameSnapshot}
                    </td>
                    <td
                      style={{
                        ...cellStyle("var(--sl-silver)"),
                        fontSize: "0.8125rem",
                      }}
                    >
                      {ev.percentBpsSnapshot !== null
                        ? `${ev.percentBpsSnapshot / 100}%`
                        : ev.flatAmountCentsSnapshot !== null
                          ? formatCents(ev.flatAmountCentsSnapshot, ev.currency)
                          : "—"}
                    </td>
                    <td
                      style={{
                        ...cellStyle("var(--sl-silver)"),
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ev.periodStart && ev.periodEnd
                        ? `${new Date(ev.periodStart).toLocaleDateString()} – ${new Date(ev.periodEnd).toLocaleDateString()}`
                        : "—"}
                    </td>
                    <td
                      style={{
                        ...cellStyle("var(--sl-silver)"),
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(ev.payoutEligibleAt).toLocaleDateString()}
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

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--sl-silver)",
          textTransform: "uppercase",
          letterSpacing: "0.075em",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "var(--sl-cream)",
          fontSize: "0.9375rem",
          fontFamily: mono ? "var(--font-mono)" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
