import React from "react";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

interface EditorialStatusPillProps {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
}

const SUCCESS_STATUSES = new Set([
  "ACTIVE",
  "APPROVED",
  "SIGNED",
  "PAID",
  "WON",
  "CONVERTED",
]);
const NEUTRAL_STATUSES = new Set([
  "PENDING_REVIEW",
  "SUBMITTED",
  "DRAFT",
  "STAGED",
  "QUEUED",
]);
const DANGER_STATUSES = new Set([
  "REJECTED",
  "CANCELLED",
  "LOST",
  "VOIDED",
  "CLAWED_BACK",
]);
const WARNING_STATUSES = new Set([
  "INVITED",
  "IN_REVIEW",
  "SENT",
  "PROCESSING",
  "PAYABLE",
  "AGREEMENT_SENT",
]);

function statusToTone(status: string): StatusTone {
  const n = status.toUpperCase();
  if (SUCCESS_STATUSES.has(n)) return "success";
  if (NEUTRAL_STATUSES.has(n)) return "neutral";
  if (DANGER_STATUSES.has(n)) return "danger";
  if (WARNING_STATUSES.has(n)) return "warning";
  return "info";
}

const toneStyle: Record<StatusTone, React.CSSProperties> = {
  success: {
    backgroundColor: "var(--status-success-bg)",
    color: "var(--status-success-text)",
    borderColor: "var(--status-success-border)",
  },
  warning: {
    backgroundColor: "var(--status-warning-bg)",
    color: "var(--status-warning-text)",
    borderColor: "var(--status-warning-border)",
  },
  danger: {
    backgroundColor: "var(--status-danger-bg)",
    color: "var(--status-danger-text)",
    borderColor: "var(--status-danger-border)",
  },
  neutral: {
    backgroundColor: "var(--silver-bg-subtle)",
    color: "var(--sl-silver)",
    borderColor: "var(--silver-border-subtle)",
  },
  info: {
    backgroundColor: "var(--silver-bg-subtle)",
    color: "var(--sl-silver)",
    borderColor: "var(--silver-border-subtle)",
  },
};

function humanize(s: string) {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EditorialStatusPill({
  status,
  label,
  tone,
  className = "",
}: EditorialStatusPillProps) {
  const resolved = tone ?? statusToTone(status);
  const display = label ?? humanize(status);
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.24em] ${className}`}
      style={toneStyle[resolved]}
    >
      {display}
    </span>
  );
}
