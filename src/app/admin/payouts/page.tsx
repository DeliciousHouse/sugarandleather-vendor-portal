import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAdminPayoutBatches,
  getPayableEvents,
} from "@/domain/payouts/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
import Button from "@/components/ui/Button";
import {
  promoteToPayableAction,
  createPayoutBatchAction,
} from "./[id]/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payouts · Admin · Sugar & Leather",
};

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

type EventRow = {
  id: string;
  partnerId: string;
  dealId: string;
  kind: string;
  tier: string;
  amount: string;
  eligible: string;
};

const eventColumns: ColumnDef<EventRow & Record<string, unknown>>[] = [
  {
    key: "partnerId",
    header: "Partner",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.partnerId}
      </span>
    ),
  },
  {
    key: "dealId",
    header: "Deal",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.dealId.slice(-8)}
      </span>
    ),
  },
  { key: "kind", header: "Kind" },
  {
    key: "tier",
    header: "Tier",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.tier}
      </span>
    ),
  },
  { key: "amount", header: "Amount", align: "right" },
  { key: "eligible", header: "Eligible since", align: "right" },
];

type BatchRow = {
  id: string;
  status: string;
  lines: number;
  currency: string;
  createdAt: string;
  paidAt: string;
};

const batchColumns: ColumnDef<BatchRow & Record<string, unknown>>[] = [
  {
    key: "id",
    header: "ID",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.id.slice(-8)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.status}
        label={BATCH_STATUS_LABELS[row.status] ?? row.status}
      />
    ),
  },
  { key: "lines", header: "Lines", align: "right" },
  { key: "currency", header: "Currency" },
  { key: "createdAt", header: "Created", align: "right" },
  { key: "paidAt", header: "Paid", align: "right" },
  {
    key: "view",
    header: "",
    align: "right",
    render: (row) => (
      <Link
        href={`/admin/payouts/${row.id}`}
        className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
      >
        <span>View</span>
        <span aria-hidden className="h-px w-6 bg-[var(--sl-cream)] transition-all group-hover:w-10 group-hover:bg-[var(--sl-lavender)]" />
      </Link>
    ),
  },
];

export default async function AdminPayoutsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const [batches, payableEvents] = await Promise.all([
    getAdminPayoutBatches(
      prisma as unknown as Parameters<typeof getAdminPayoutBatches>[0],
    ),
    getPayableEvents(
      prisma as unknown as Parameters<typeof getPayableEvents>[0],
    ),
  ]);

  const totalPayable = payableEvents.reduce((sum, e) => sum + e.amountCents, 0);

  const eventRows: (EventRow & Record<string, unknown>)[] = payableEvents.map(
    (e) => ({
      id: e.id,
      partnerId: e.partnerId,
      dealId: e.dealId,
      kind: e.kind,
      tier: e.tierNameSnapshot,
      amount: formatCents(e.amountCents, e.currency),
      eligible: new Date(e.payoutEligibleAt).toLocaleDateString(),
    }),
  );

  const batchRows: (BatchRow & Record<string, unknown>)[] = batches.map((b) => ({
    id: b.id,
    status: b.status,
    lines: b._count.lines,
    currency: b.currency,
    createdAt: new Date(b.createdAt).toLocaleDateString(),
    paidAt: b.paidAt ? new Date(b.paidAt).toLocaleDateString() : "—",
  }));

  return (
    <EditorialPageShell
      sectionLabel="02 / Payouts"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Payouts" },
      ]}
      eyebrow="Commission stage"
      headline={
        payableEvents.length === 0
          ? "Nothing payable"
          : `${formatCents(totalPayable, "USD")} payable`
      }
      subheadline={
        payableEvents.length > 0
          ? `Across ${payableEvents.length} event${payableEvents.length !== 1 ? "s" : ""}`
          : undefined
      }
      actions={
        payableEvents.length > 0 ? (
          <form action={createPayoutBatchAction}>
            <input
              type="hidden"
              name="eventIds"
              value={JSON.stringify(payableEvents.map((e) => e.id))}
            />
            <Button type="submit" size="sm">
              Create batch ({payableEvents.length})
            </Button>
          </form>
        ) : null
      }
      mainChildren={
        <div className="flex flex-col gap-12">
          <section className="border-t border-[var(--border-dark)] pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                Promote staged → payable
              </p>
              <form action={promoteToPayableAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Run promotion
                </Button>
              </form>
            </div>
            <p className="mt-3 max-w-xl font-body text-sm text-[var(--sl-silver)]">
              Move eligible staged commissions (past their payout delay
              window) to payable status.
            </p>
          </section>

          {payableEvents.length > 0 ? (
            <section>
              <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                Payable events
              </h2>
              <EditorialTable
                columns={eventColumns}
                data={eventRows}
                rowKey={(row) => row.id}
                emptyMessage="No payable events."
              />
            </section>
          ) : null}

          <section>
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Payout batches
            </h2>
            <EditorialTable
              columns={batchColumns}
              data={batchRows}
              rowKey={(row) => row.id}
              emptyMessage="No payout batches yet."
            />
          </section>
        </div>
      }
    />
  );
}
