import React from "react";
import type {
  PartnerEarningsRow,
  PartnerEarningsSummary,
} from "@/domain/dashboard/queries";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill, {
  type StatusTone,
} from "@/components/brand/EditorialStatusPill";

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

const STATUS_TONE: Record<string, StatusTone> = {
  STAGED: "warning",
  PAYABLE: "info",
  PAID: "success",
  CLAWED_BACK: "danger",
  VOIDED: "neutral",
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

const SUMMARY_ITEMS: Array<{
  key: keyof Omit<PartnerEarningsSummary, "currency">;
  label: string;
}> = [
  { key: "STAGED", label: "Staged" },
  { key: "PAYABLE", label: "Payable" },
  { key: "PAID", label: "Paid" },
  { key: "CLAWED_BACK", label: "Clawed back" },
];

type Row = {
  id: string;
  kind: string;
  status: string;
  amount: string;
  amountIsNegative: boolean;
  tier: string;
  eligible: string;
  paid: string;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  {
    key: "kind",
    header: "Type",
    render: (row) => KIND_LABELS[row.kind] ?? row.kind,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.status}
        label={STATUS_LABELS[row.status] ?? row.status}
        tone={STATUS_TONE[row.status]}
      />
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (row) => (
      <span
        className={
          row.amountIsNegative
            ? "text-[var(--status-danger-text)] tabular-nums"
            : "tabular-nums"
        }
      >
        {row.amountIsNegative ? "−" : ""}
        {row.amount}
      </span>
    ),
  },
  {
    key: "tier",
    header: "Tier",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.tier}
      </span>
    ),
  },
  { key: "eligible", header: "Eligible", align: "right" },
  { key: "paid", header: "Paid", align: "right" },
];

export default function EarningsTimeline({
  events,
  summary,
}: EarningsTimelineProps) {
  const rows: (Row & Record<string, unknown>)[] = events.map((event) => ({
    id: event.id,
    kind: event.kind,
    status: event.status,
    amount: formatCents(event.amountCents, event.currency),
    amountIsNegative: event.status === "CLAWED_BACK",
    tier: event.tierNameSnapshot,
    eligible: event.payoutEligibleAt.toLocaleDateString(),
    paid: event.paidAt ? event.paidAt.toLocaleDateString() : "—",
  }));

  return (
    <div className="flex flex-col gap-12">
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_ITEMS.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col gap-2 border-t border-[var(--border-dark)] pt-4"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              {label}
            </span>
            <span className="font-heading text-3xl text-[var(--sl-cream)] tabular-nums">
              {formatCents(summary[key], summary.currency)}
            </span>
          </div>
        ))}
      </section>

      <section className="border-t border-[var(--border-dark)] pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
          Payout timing
        </p>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-[var(--sl-silver)]">
          Commissions move from{" "}
          <span className="text-[var(--status-warning-text)]">Staged</span> to{" "}
          <span className="text-[var(--sl-cream)]">Payable</span> once the delay
          window in your agreement has passed. Your admin will process payments
          on the eligible date shown below. Commissions may be subject to
          clawback within the agreement window.
        </p>
      </section>

      <EditorialTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        emptyMessage="No commission events yet."
      />
    </div>
  );
}
