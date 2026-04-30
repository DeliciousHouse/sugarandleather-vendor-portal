import React from "react";
import { notFound, redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPayoutBatchById } from "@/domain/payouts/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
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

type LineRow = {
  id: string;
  partnerId: string;
  commissionEventId: string;
  amount: string;
  batchId: string;
  batchStatus: string;
};

const lineColumns: ColumnDef<LineRow & Record<string, unknown>>[] = [
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
    key: "commissionEventId",
    header: "Commission event",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.commissionEventId}
      </span>
    ),
  },
  { key: "amount", header: "Amount", align: "right" },
  {
    key: "actions",
    header: "Clawback",
    align: "right",
    render: (row) =>
      row.batchStatus === "PAID" ? (
        <PayoutBatchActions
          batchId={row.batchId}
          batchStatus={row.batchStatus}
          clawbackEventId={row.commissionEventId}
        />
      ) : null,
  },
];

export default async function AdminPayoutBatchPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const batch = await getAdminPayoutBatchById(
    prisma as unknown as Parameters<typeof getAdminPayoutBatchById>[0],
    id,
  );

  if (!batch) {
    notFound();
  }

  const totalCents = batch.lines.reduce((sum, l) => sum + l.amountCents, 0);

  const rows: (LineRow & Record<string, unknown>)[] = batch.lines.map((l) => ({
    id: l.id,
    partnerId: l.partnerId,
    commissionEventId: l.commissionEventId,
    amount: formatCents(l.amountCents, l.currency),
    batchId: batch.id,
    batchStatus: batch.status,
  }));

  return (
    <EditorialPageShell
      sectionLabel="03 / Payout batch"
      crumbs={[
        { label: "Payouts", href: "/admin/payouts" },
        { label: batch.id.slice(-8) },
      ]}
      eyebrow="Batch"
      headline={formatCents(totalCents, batch.currency)}
      subheadline={`${batch.lines.length} ${batch.lines.length === 1 ? "line" : "lines"}${batch.paidAt ? ` · paid ${new Date(batch.paidAt).toLocaleDateString()}` : ""}`}
      actions={
        <div className="flex items-center gap-3">
          <EditorialStatusPill
            status={batch.status}
            label={BATCH_STATUS_LABELS[batch.status] ?? batch.status}
          />
          {batch.status !== "PAID" && batch.status !== "VOIDED" ? (
            <PayoutBatchActions batchId={batch.id} batchStatus={batch.status} />
          ) : null}
        </div>
      }
      mainChildren={
        <div className="flex flex-col gap-12">
          <div className="border-t border-[var(--border-dark)] pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Batch ID
            </p>
            <p className="mt-2 font-mono text-sm text-[var(--sl-cream)]">
              {batch.id}
            </p>
          </div>
          {batch.notes ? (
            <div className="border-t border-[var(--border-dark)] pt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                Notes
              </p>
              <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-[var(--sl-silver)]">
                {batch.notes}
              </p>
            </div>
          ) : null}
          <EditorialTable
            columns={lineColumns}
            data={rows}
            rowKey={(row) => row.id}
            emptyMessage="No lines in this batch."
          />
          <div className="flex items-baseline justify-end gap-6 border-t border-[var(--border-dark)] pt-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Total
            </span>
            <span className="font-heading text-2xl text-[var(--sl-cream)] tabular-nums">
              {formatCents(totalCents, batch.currency)}
            </span>
          </div>
        </div>
      }
    />
  );
}
