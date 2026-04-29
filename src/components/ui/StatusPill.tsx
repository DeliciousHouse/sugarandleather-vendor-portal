import React from "react";
import Badge, { BadgeVariant } from "./Badge";

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
}

const SUCCESS_STATUSES = new Set([
  "ACTIVE",
  "APPROVED",
  "SIGNED",
  "PAID",
  "WON",
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
]);

function statusToVariant(status: string): BadgeVariant {
  const normalized = status.toUpperCase();
  if (SUCCESS_STATUSES.has(normalized)) return "success";
  if (NEUTRAL_STATUSES.has(normalized)) return "neutral";
  if (DANGER_STATUSES.has(normalized)) return "danger";
  if (WARNING_STATUSES.has(normalized)) return "warning";
  return "default";
}

export default function StatusPill({ status, label, className }: StatusPillProps) {
  const variant = statusToVariant(status);
  const displayLabel = label ?? status;

  return (
    <Badge variant={variant} className={className}>
      {displayLabel}
    </Badge>
  );
}
