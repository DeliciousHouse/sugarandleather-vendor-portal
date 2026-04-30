import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: "var(--silver-bg-subtle)",
    color: "var(--sl-silver)",
    border: "1px solid var(--silver-border-subtle)",
  },
  success: {
    backgroundColor: "var(--status-success-bg)",
    color: "var(--status-success-text)",
    border: "1px solid var(--status-success-border)",
  },
  warning: {
    backgroundColor: "var(--status-warning-bg)",
    color: "var(--status-warning-text)",
    border: "1px solid var(--status-warning-border)",
  },
  danger: {
    backgroundColor: "var(--status-danger-bg)",
    color: "var(--status-danger-text)",
    border: "1px solid var(--status-danger-border)",
  },
  neutral: {
    backgroundColor: "var(--silver-bg-subtle)",
    color: "var(--sl-silver)",
    border: "1px solid var(--silver-border-subtle)",
  },
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.24em] ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
