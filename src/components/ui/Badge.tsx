import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: "var(--accent-bg-subtle)",
    color: "var(--sl-lavender)",
    border: "1px solid var(--accent-border-subtle)",
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
