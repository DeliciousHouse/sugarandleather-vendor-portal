import React from "react";
import { notFound, redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminDealById } from "@/domain/deals/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
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
    <form action={transition} className="inline-flex items-center gap-3">
      {targetStatus === "LOST" ? (
        <input
          name="lostReason"
          placeholder="Reason"
          className="border-b border-[var(--border-dark)] bg-transparent py-1 font-body text-sm text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:border-[var(--sl-cream)] focus:outline-none"
        />
      ) : null}
      <Button type="submit" variant={variant} size="sm">
        {label}
      </Button>
    </form>
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
    <div className="border-t border-[var(--border-dark)] pt-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
        {label}
      </p>
      <div
        className={`mt-2 text-base text-[var(--sl-cream)] ${mono ? "font-mono text-sm" : "font-body"}`}
      >
        {value}
      </div>
    </div>
  );
}

type CommissionRow = {
  id: string;
  kind: string;
  status: string;
  amount: string;
  tier: string;
  rule: string;
  period: string;
  eligible: string;
};

const commissionColumns: ColumnDef<CommissionRow & Record<string, unknown>>[] = [
  {
    key: "kind",
    header: "Kind",
    render: (row) => COMMISSION_KIND_LABELS[row.kind] ?? row.kind,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.status}
        label={COMMISSION_STATUS_LABELS[row.status] ?? row.status}
      />
    ),
  },
  { key: "amount", header: "Amount", align: "right" },
  {
    key: "tier",
    header: "Tier",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.tier}
      </span>
    ),
  },
  { key: "rule", header: "Rule" },
  { key: "period", header: "Period", align: "right" },
  { key: "eligible", header: "Eligible", align: "right" },
];

export default async function AdminDealDetailPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const deal = await getAdminDealById(
    prisma as unknown as Parameters<typeof getAdminDealById>[0],
    id,
  );

  if (!deal) notFound();

  const isOpen = deal.status === "OPEN";

  const commissionRows: (CommissionRow & Record<string, unknown>)[] =
    deal.commissionEvents.map((ev) => ({
      id: ev.id,
      kind: ev.kind,
      status: ev.status,
      amount: formatCents(ev.amountCents, ev.currency),
      tier: ev.tierNameSnapshot,
      rule:
        ev.percentBpsSnapshot !== null
          ? `${ev.percentBpsSnapshot / 100}%`
          : ev.flatAmountCentsSnapshot !== null
            ? formatCents(ev.flatAmountCentsSnapshot, ev.currency)
            : "—",
      period:
        ev.periodStart && ev.periodEnd
          ? `${new Date(ev.periodStart).toLocaleDateString()} – ${new Date(ev.periodEnd).toLocaleDateString()}`
          : "—",
      eligible: new Date(ev.payoutEligibleAt).toLocaleDateString(),
    }));

  return (
    <EditorialPageShell
      sectionLabel="03 / Deal"
      crumbs={[
        { label: "Deals", href: "/admin/deals" },
        { label: deal.productCode },
      ]}
      eyebrow="Pipeline record"
      headline={formatCents(deal.amountCents, deal.currency)}
      subheadline={`${deal.productCode}${deal.packageCode ? ` · ${deal.packageCode}` : ""} · ${STATUS_LABELS[deal.status] ?? deal.status}`}
      actions={
        <EditorialStatusPill
          status={deal.status}
          label={STATUS_LABELS[deal.status] ?? deal.status}
        />
      }
      mainChildren={
        <div className="flex flex-col gap-12">
          <section>
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Details
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Partner ID" value={deal.partnerId} mono />
              <Field label="Referral ID" value={deal.referralId} mono />
              <Field label="Product" value={deal.productCode} />
              {deal.packageCode ? (
                <Field label="Package" value={deal.packageCode} />
              ) : null}
              <Field
                label="Amount"
                value={formatCents(deal.amountCents, deal.currency)}
              />
              {deal.closedAt ? (
                <Field
                  label="Closed"
                  value={new Date(deal.closedAt).toLocaleDateString()}
                />
              ) : null}
              {deal.externalCrmId ? (
                <Field label="CRM ID" value={deal.externalCrmId} mono />
              ) : null}
              {deal.lostReason ? (
                <Field label="Lost reason" value={deal.lostReason} />
              ) : null}
            </div>
          </section>

          {isOpen ? (
            <section className="border-t border-[var(--border-dark)] pt-6">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                Transition
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <StatusTransitionForm
                  dealId={deal.id}
                  targetStatus="WON"
                  label="Mark won"
                  variant="primary"
                />
                <StatusTransitionForm
                  dealId={deal.id}
                  targetStatus="LOST"
                  label="Mark lost"
                  variant="secondary"
                />
                <StatusTransitionForm
                  dealId={deal.id}
                  targetStatus="CANCELLED"
                  label="Cancel"
                  variant="danger"
                />
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Commission events
            </h2>
            <EditorialTable
              columns={commissionColumns}
              data={commissionRows}
              rowKey={(row) => row.id}
              emptyMessage="No commission events yet. Mark deal won to stage commissions."
            />
          </section>
        </div>
      }
    />
  );
}
