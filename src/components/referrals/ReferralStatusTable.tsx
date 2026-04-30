import React from "react";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

export type ReferralRow = {
  id: string;
  leadName: string;
  leadEmail?: string | null;
  leadCompany?: string | null;
  country?: string | null;
  attributionStatus: "FIRST_ATTRIBUTED" | "DUPLICATE_NO_CREDIT";
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED" | "LOST";
  submittedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
  LOST: "Lost",
  FIRST_ATTRIBUTED: "Attributed",
  DUPLICATE_NO_CREDIT: "Duplicate · no credit",
};

type RowRecord = ReferralRow & Record<string, unknown>;

const columns: ColumnDef<RowRecord>[] = [
  {
    key: "leadName",
    header: "Lead",
    render: (row) => (
      <div className="flex flex-col">
        <span className="font-body text-[var(--sl-cream)]">{row.leadName}</span>
        {row.leadEmail ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
            {row.leadEmail}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    key: "leadCompany",
    header: "Company",
    render: (row) => row.leadCompany ?? "—",
  },
  {
    key: "country",
    header: "Country",
    render: (row) => row.country ?? "—",
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
];

type Props = {
  referrals: ReferralRow[];
};

export default function ReferralStatusTable({ referrals }: Props) {
  return (
    <EditorialTable
      columns={columns}
      data={referrals as RowRecord[]}
      rowKey={(row) => row.id}
      emptyMessage="No referrals submitted yet."
    />
  );
}
