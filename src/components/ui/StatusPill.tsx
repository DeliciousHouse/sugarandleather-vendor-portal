import React from "react";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
}

export default function StatusPill({ status, label, className }: StatusPillProps) {
  return (
    <EditorialStatusPill status={status} label={label} className={className} />
  );
}
