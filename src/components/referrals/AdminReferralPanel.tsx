import React from "react";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
import type { AdminReferralRow } from "@/domain/referrals/queries";

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
  LOST: "Lost",
  FIRST_ATTRIBUTED: "First attributed",
  DUPLICATE_NO_CREDIT: "Duplicate · no credit",
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
    <div className="flex flex-col gap-2 border-b border-[var(--border-dark)] py-4 last:border-b-0 sm:flex-row sm:gap-8">
      <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)] sm:w-40 sm:shrink-0">
        {label}
      </dt>
      <dd className="font-body text-sm text-[var(--sl-cream)] m-0">{value}</dd>
    </div>
  );
}

export default function AdminReferralPanel({
  referral,
  approveAction,
  rejectAction,
}: Props) {
  const isDuplicateNoCredit =
    referral.attributionStatus === "DUPLICATE_NO_CREDIT";
  const isPendingReview = referral.status === "PENDING_REVIEW";

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center gap-3">
        <EditorialStatusPill
          status={referral.attributionStatus}
          label={
            STATUS_LABELS[referral.attributionStatus] ??
            referral.attributionStatus
          }
          tone={referral.attributionStatus === "FIRST_ATTRIBUTED" ? "success" : "neutral"}
        />
        <EditorialStatusPill
          status={referral.status}
          label={STATUS_LABELS[referral.status] ?? referral.status}
        />
      </div>

      <dl className="m-0">
        <FieldRow label="Lead email" value={referral.leadEmail ?? "—"} />
        <FieldRow label="Company" value={referral.leadCompany ?? "—"} />
        <FieldRow label="Domain" value={referral.leadDomain ?? "—"} />
        <FieldRow
          label="Attribution key"
          value={
            <code className="font-mono text-sm text-[var(--sl-silver)]">
              {referral.attributionKey}
            </code>
          }
        />
        <FieldRow label="Country" value={referral.country ?? "—"} />
        <FieldRow
          label="Submitted"
          value={new Date(referral.submittedAt).toLocaleString()}
        />
        {referral.notes ? (
          <FieldRow label="Partner notes" value={referral.notes} />
        ) : null}
        {referral.adminNotes ? (
          <FieldRow label="Admin notes" value={referral.adminNotes} />
        ) : null}
        {referral.reviewedAt ? (
          <FieldRow
            label="Reviewed at"
            value={new Date(referral.reviewedAt).toLocaleString()}
          />
        ) : null}
      </dl>

      {isDuplicateNoCredit && isPendingReview ? (
        <p className="border-l-2 border-[var(--status-warning-text)] pl-4 font-body text-sm leading-relaxed text-[var(--status-warning-text)]">
          This referral is a duplicate. Approving it will mark it as reviewed
          but it cannot count for credit.
        </p>
      ) : null}

      {isPendingReview && (approveAction || rejectAction) ? (
        <div className="flex flex-wrap justify-end gap-6 border-t border-[var(--border-dark)] pt-8">
          {rejectAction}
          {!isDuplicateNoCredit && approveAction}
        </div>
      ) : null}
    </div>
  );
}
