import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminReferrals } from "@/domain/referrals/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Referrals · Admin · Sugar & Leather",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
  LOST: "Lost",
  FIRST_ATTRIBUTED: "First attributed",
  DUPLICATE_NO_CREDIT: "Duplicate · no credit",
};

type Row = {
  id: string;
  leadName: string;
  leadEmail: string | null;
  partnerId: string;
  attributionStatus: string;
  status: string;
  submittedAt: Date | string;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  {
    key: "leadName",
    header: "Lead",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[var(--sl-cream)]">{row.leadName}</span>
        {row.leadEmail ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
            {row.leadEmail}
          </span>
        ) : null}
      </div>
    ),
  },
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
    key: "attributionStatus",
    header: "Attribution",
    render: (row) => (
      <EditorialStatusPill
        status={row.attributionStatus}
        label={STATUS_LABELS[row.attributionStatus] ?? row.attributionStatus}
        tone={row.attributionStatus === "FIRST_ATTRIBUTED" ? "success" : "neutral"}
      />
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.status}
        label={STATUS_LABELS[row.status] ?? row.status}
      />
    ),
  },
  {
    key: "submittedAt",
    header: "Submitted",
    align: "right",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {new Date(row.submittedAt).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: "id",
    header: "",
    align: "right",
    render: (row) => (
      <Link
        href={`/admin/referrals/${row.id}`}
        className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
      >
        <span>Review</span>
        <span aria-hidden className="h-px w-6 bg-[var(--sl-cream)] transition-all group-hover:w-10 group-hover:bg-[var(--sl-lavender)]" />
      </Link>
    ),
  },
];

export default async function AdminReferralsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const referrals = await getAdminReferrals(
    prisma as unknown as Parameters<typeof getAdminReferrals>[0],
  );

  const total = referrals.length;
  const pending = referrals.filter((r) => r.status === "PENDING_REVIEW").length;

  const rows: (Row & Record<string, unknown>)[] = referrals.map((r) => ({
    id: r.id,
    leadName: r.leadName,
    leadEmail: r.leadEmail ?? null,
    partnerId: r.partnerId,
    attributionStatus: r.attributionStatus,
    status: r.status,
    submittedAt: r.submittedAt,
  }));

  return (
    <EditorialPageShell
      sectionLabel="02 / Referrals"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Referrals" },
      ]}
      eyebrow="Review queue"
      headline={total === 0 ? "Queue is clear" : `${total} ${total === 1 ? "referral" : "referrals"}`}
      subheadline={pending > 0 ? `${pending} pending review` : undefined}
      mainChildren={
        <EditorialTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          emptyMessage="No referrals yet."
        />
      }
    />
  );
}
