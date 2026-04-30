import React from "react";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

export type ApplicationDetail = {
  id: string;
  status: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string;
  promotionChannels: string[];
  aiTechExperience: string;
  audience: string;
  subjectiveAnswers: Record<string, string>;
  reviewedById: string | null;
  reviewedAt: Date | string | null;
  reviewNotes: string | null;
  createdAt: Date | string;
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  REJECTED: "Rejected",
  APPROVED_PENDING_AGREEMENT: "Approved · pending agreement",
  AGREEMENT_SENT: "Agreement sent",
  SIGNED: "Signed",
  ACTIVATED: "Activated",
};

function InfoRow({
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
      <dd className="font-body text-sm text-[var(--sl-cream)]">
        {value || (
          <span className="text-[var(--sl-mid-gray)]">—</span>
        )}
      </dd>
    </div>
  );
}

function Timeline({ app }: { app: ApplicationDetail }) {
  const createdAt =
    typeof app.createdAt === "string" ? new Date(app.createdAt) : app.createdAt;
  const reviewedAt = app.reviewedAt
    ? typeof app.reviewedAt === "string"
      ? new Date(app.reviewedAt)
      : app.reviewedAt
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-px w-6 bg-[var(--sl-cream)]"
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)]">
          Submitted
          <span className="ml-3 text-[var(--sl-silver)]">
            {createdAt.toLocaleDateString()}
          </span>
        </span>
      </div>
      {reviewedAt ? (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-px w-6 bg-[var(--sl-lavender)]"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)]">
            {STATUS_LABELS[app.status] ?? app.status}
            <span className="ml-3 text-[var(--sl-silver)]">
              {reviewedAt.toLocaleDateString()}
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

interface ApplicationReviewPanelProps {
  app: ApplicationDetail;
  actions?: React.ReactNode;
}

export default function ApplicationReviewPanel({
  app,
  actions,
}: ApplicationReviewPanelProps) {
  const subjectiveAnswers = app.subjectiveAnswers ?? {};

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center gap-4">
        <EditorialStatusPill
          status={app.status}
          label={STATUS_LABELS[app.status] ?? app.status}
        />
      </div>

      <section aria-labelledby="timeline-heading">
        <h2
          id="timeline-heading"
          className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]"
        >
          Status
        </h2>
        <Timeline app={app} />
      </section>

      <section aria-labelledby="details-heading">
        <h2
          id="details-heading"
          className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]"
        >
          Details
        </h2>
        <dl className="flex flex-col">
          <InfoRow label="Full name" value={app.fullName} />
          <InfoRow label="Email" value={app.email} />
          <InfoRow label="Phone" value={app.phone} />
          <InfoRow label="Company" value={app.company} />
          <InfoRow label="Country" value={app.country} />
          <InfoRow label="Channels" value={app.promotionChannels.join(", ")} />
          <InfoRow
            label="AI experience"
            value={
              <p className="whitespace-pre-wrap leading-relaxed">
                {app.aiTechExperience}
              </p>
            }
          />
          <InfoRow
            label="Audience"
            value={
              <p className="whitespace-pre-wrap leading-relaxed">
                {app.audience}
              </p>
            }
          />
        </dl>
      </section>

      <section aria-labelledby="subjective-heading">
        <h2
          id="subjective-heading"
          className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]"
        >
          Applicant answers
        </h2>
        <div className="flex flex-col gap-8">
          {Object.entries(subjectiveAnswers).map(([key, answer]) => (
            <div key={key}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="font-body text-sm leading-relaxed text-[var(--sl-cream)] whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {app.reviewNotes ? (
        <section aria-labelledby="notes-heading">
          <h2
            id="notes-heading"
            className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]"
          >
            Review notes
          </h2>
          <p className="font-body text-sm leading-relaxed text-[var(--sl-cream)] whitespace-pre-wrap">
            {app.reviewNotes}
          </p>
        </section>
      ) : null}

      {actions ? (
        <section
          aria-label="Review actions"
          className="border-t border-[var(--border-dark)] pt-8"
        >
          {actions}
        </section>
      ) : null}
    </div>
  );
}
