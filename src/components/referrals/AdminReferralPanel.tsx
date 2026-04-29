import React from "react";
import StatusPill from "@/components/ui/StatusPill";
import type { AdminReferralRow } from "@/domain/referrals/queries";

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
  LOST: "Lost",
  FIRST_ATTRIBUTED: "First attributed",
  DUPLICATE_NO_CREDIT: "Duplicate — no credit",
};

type Props = {
  referral: AdminReferralRow;
  approveAction?: React.ReactNode;
  rejectAction?: React.ReactNode;
};

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "10rem 1fr",
        gap: "1rem",
        padding: "0.625rem 0",
        borderBottom: "1px solid var(--border-dark)",
      }}
    >
      <dt style={{ fontSize: "0.8125rem", color: "var(--sl-silver)", fontWeight: 500 }}>
        {label}
      </dt>
      <dd style={{ fontSize: "0.9375rem", color: "var(--sl-cream)", margin: 0 }}>
        {value}
      </dd>
    </div>
  );
}

export default function AdminReferralPanel({ referral, approveAction, rejectAction }: Props) {
  const isDuplicateNoCredit = referral.attributionStatus === "DUPLICATE_NO_CREDIT";
  const isPendingReview = referral.status === "PENDING_REVIEW";

  return (
    <div
      style={{
        backgroundColor: "var(--surface-panel)",
        border: "1px solid var(--border-dark)",
        borderRadius: "0.75rem",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--sl-cream)",
            margin: 0,
          }}
        >
          {referral.leadName}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <StatusPill
            status={referral.attributionStatus}
            label={STATUS_LABELS[referral.attributionStatus] ?? referral.attributionStatus}
          />
          <StatusPill
            status={referral.status}
            label={STATUS_LABELS[referral.status] ?? referral.status}
          />
        </div>
      </div>

      <dl style={{ margin: 0 }}>
        <FieldRow label="Lead email" value={referral.leadEmail ?? "—"} />
        <FieldRow label="Company" value={referral.leadCompany ?? "—"} />
        <FieldRow label="Domain" value={referral.leadDomain ?? "—"} />
        <FieldRow label="Attribution key" value={
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
            {referral.attributionKey}
          </code>
        } />
        <FieldRow label="Country" value={referral.country ?? "—"} />
        <FieldRow
          label="Submitted"
          value={new Date(referral.submittedAt).toLocaleString()}
        />
        {referral.notes && (
          <FieldRow label="Partner notes" value={referral.notes} />
        )}
        {referral.adminNotes && (
          <FieldRow label="Admin notes" value={referral.adminNotes} />
        )}
        {referral.reviewedAt && (
          <FieldRow
            label="Reviewed at"
            value={new Date(referral.reviewedAt).toLocaleString()}
          />
        )}
      </dl>

      {isDuplicateNoCredit && isPendingReview && (
        <div
          style={{
            marginTop: "1.25rem",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--status-warning-bg)",
            border: "1px solid var(--status-warning-border)",
            borderRadius: "0.5rem",
            color: "var(--status-warning-text)",
            fontSize: "0.875rem",
          }}
        >
          This referral is a duplicate. Approving it will mark it as reviewed but it cannot count for credit.
        </div>
      )}

      {isPendingReview && (approveAction || rejectAction) && (
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          {rejectAction}
          {!isDuplicateNoCredit && approveAction}
        </div>
      )}
    </div>
  );
}
