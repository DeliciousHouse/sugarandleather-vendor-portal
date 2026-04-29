import React from "react";

export type QuarterlyActivityCardProps = {
  quarter: string;
  activity: {
    referralsSubmitted: number;
    referralsApproved: number;
    dealsWon: number;
    revenueCents: number;
    commissionCents: number;
  };
  tierCompliance: {
    meetsRequirements: boolean;
    minimumReferralsRequired: number | null;
    referralsApproved: number;
  };
  snapshot?: {
    overrideStatus: string | null;
    overrideReason: string | null;
  } | null;
};

function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function QuarterlyActivityCard({
  quarter,
  activity,
  tierCompliance,
  snapshot,
}: QuarterlyActivityCardProps) {
  const hasOverride = snapshot?.overrideStatus != null;

  return (
    <div
      style={{
        backgroundColor: "var(--surface-panel)",
        border: "1px solid var(--border-dark)",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        color: "var(--text-primary-dark)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--sl-cream)",
            margin: 0,
          }}
        >
          {quarter}
        </h2>

        {hasOverride && (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.125rem 0.625rem",
              borderRadius: "9999px",
              backgroundColor: "var(--accent-bg-subtle)",
              color: "var(--sl-lavender)",
              fontWeight: 600,
            }}
          >
            Override: {snapshot!.overrideStatus}
          </span>
        )}
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <MetricItem label="Referrals Submitted" value={String(activity.referralsSubmitted)} />
        <MetricItem label="Referrals Approved" value={String(activity.referralsApproved)} />
        <MetricItem label="Deals Won" value={String(activity.dealsWon)} />
        <MetricItem label="Revenue" value={formatDollars(activity.revenueCents)} />
        <MetricItem label="Commission Earned" value={formatDollars(activity.commissionCents)} />
      </div>

      {/* Tier compliance */}
      <div
        style={{
          borderTop: "1px solid var(--border-dark)",
          paddingTop: "0.75rem",
          marginBottom: hasOverride && snapshot?.overrideReason ? "0.75rem" : 0,
        }}
      >
        {tierCompliance.minimumReferralsRequired === null ? (
          <span style={{ fontSize: "0.875rem", color: "var(--sl-silver)" }}>
            No minimum referral requirement
          </span>
        ) : tierCompliance.meetsRequirements ? (
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--accent)",
              fontWeight: 500,
            }}
          >
            Meets requirements
          </span>
        ) : (
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--sl-mid-gray)",
              fontWeight: 500,
            }}
          >
            Below minimum ({tierCompliance.minimumReferralsRequired} required,{" "}
            {tierCompliance.referralsApproved} approved)
          </span>
        )}
      </div>

      {/* Override reason */}
      {hasOverride && snapshot?.overrideReason && (
        <div
          style={{
            borderTop: "1px solid var(--border-dark)",
            paddingTop: "0.75rem",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--sl-silver)" }}>
            Override reason:{" "}
          </span>
          <span style={{ fontSize: "0.8125rem", color: "var(--sl-cream)" }}>
            {snapshot.overrideReason}
          </span>
        </div>
      )}
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--text-secondary-dark)",
          marginBottom: "0.125rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--sl-cream)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
