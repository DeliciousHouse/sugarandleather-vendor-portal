import StatusPill from "@/components/ui/StatusPill";

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
  APPROVED_PENDING_AGREEMENT: "Approved — pending agreement",
  AGREEMENT_SENT: "Agreement sent",
  SIGNED: "Signed",
  ACTIVATED: "Activated",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 flex gap-4 border-b" style={{ borderColor: "var(--border-dark)" }}>
      <dt
        className="text-sm font-medium w-40 shrink-0"
        style={{ color: "var(--sl-silver)" }}
      >
        {label}
      </dt>
      <dd className="text-sm" style={{ color: "var(--sl-cream)" }}>
        {value || <span style={{ color: "var(--sl-mid-gray)" }}>—</span>}
      </dd>
    </div>
  );
}

function Timeline({ app }: { app: ApplicationDetail }) {
  const createdAt =
    typeof app.createdAt === "string"
      ? new Date(app.createdAt)
      : app.createdAt;
  const reviewedAt =
    app.reviewedAt
      ? typeof app.reviewedAt === "string"
        ? new Date(app.reviewedAt)
        : app.reviewedAt
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: "var(--sl-lavender)" }}
        />
        <span className="text-sm" style={{ color: "var(--sl-cream)" }}>
          Application submitted{" "}
          <span style={{ color: "var(--sl-mid-gray)" }}>
            {createdAt.toLocaleDateString()}
          </span>
        </span>
      </div>
      {reviewedAt && (
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: "var(--sl-lavender)" }}
          />
          <span className="text-sm" style={{ color: "var(--sl-cream)" }}>
            {STATUS_LABELS[app.status] ?? app.status}{" "}
            <span style={{ color: "var(--sl-mid-gray)" }}>
              {reviewedAt.toLocaleDateString()}
            </span>
          </span>
        </div>
      )}
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--sl-cream)",
            }}
          >
            {app.fullName}
          </h1>
          <p className="text-sm" style={{ color: "var(--sl-mid-gray)" }}>
            {app.email}
          </p>
        </div>
        <StatusPill
          status={app.status}
          label={STATUS_LABELS[app.status] ?? app.status}
        />
      </div>

      {/* Status timeline */}
      <section
        aria-labelledby="timeline-heading"
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--surface-panel)",
          borderColor: "var(--border-dark)",
        }}
      >
        <h2
          id="timeline-heading"
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--sl-silver)" }}
        >
          Status timeline
        </h2>
        <Timeline app={app} />
      </section>

      {/* Application details */}
      <section
        aria-labelledby="details-heading"
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--surface-panel)",
          borderColor: "var(--border-dark)",
        }}
      >
        <h2
          id="details-heading"
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--sl-silver)" }}
        >
          Application details
        </h2>
        <dl>
          <InfoRow label="Full name" value={app.fullName} />
          <InfoRow label="Email" value={app.email} />
          <InfoRow label="Phone" value={app.phone} />
          <InfoRow label="Company" value={app.company} />
          <InfoRow label="Country" value={app.country} />
          <InfoRow
            label="Channels"
            value={app.promotionChannels.join(", ")}
          />
          <InfoRow
            label="AI experience"
            value={
              <p className="whitespace-pre-wrap">{app.aiTechExperience}</p>
            }
          />
          <InfoRow
            label="Audience"
            value={<p className="whitespace-pre-wrap">{app.audience}</p>}
          />
        </dl>
      </section>

      {/* Subjective answers */}
      <section
        aria-labelledby="subjective-heading"
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--surface-panel)",
          borderColor: "var(--border-dark)",
        }}
      >
        <h2
          id="subjective-heading"
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--sl-silver)" }}
        >
          Applicant answers
        </h2>
        <div className="flex flex-col gap-4">
          {Object.entries(subjectiveAnswers).map(([key, answer]) => (
            <div key={key}>
              <p
                className="text-xs font-medium uppercase tracking-wide mb-1"
                style={{ color: "var(--sl-lavender)" }}
              >
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: "var(--sl-cream)" }}
              >
                {answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Admin notes */}
      {app.reviewNotes && (
        <section
          aria-labelledby="notes-heading"
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "var(--surface-panel)",
            borderColor: "var(--border-dark)",
          }}
        >
          <h2
            id="notes-heading"
            className="text-sm font-semibold mb-2"
            style={{ color: "var(--sl-silver)" }}
          >
            Review notes
          </h2>
          <p
            className="text-sm whitespace-pre-wrap"
            style={{ color: "var(--sl-cream)" }}
          >
            {app.reviewNotes}
          </p>
        </section>
      )}

      {/* Action area */}
      {actions && (
        <section aria-label="Review actions">{actions}</section>
      )}
    </div>
  );
}
