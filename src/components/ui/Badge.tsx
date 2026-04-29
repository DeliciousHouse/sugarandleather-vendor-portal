import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: "rgba(197, 184, 212, 0.2)",
    color: "var(--sl-lavender)",
    border: "1px solid rgba(197, 184, 212, 0.35)",
  },
  success: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    color: "#86EFAC",
    border: "1px solid rgba(34, 197, 94, 0.25)",
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    color: "#FCD34D",
    border: "1px solid rgba(245, 158, 11, 0.25)",
  },
  danger: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    color: "#FCA5A5",
    border: "1px solid rgba(239, 68, 68, 0.25)",
  },
  neutral: {
    backgroundColor: "rgba(168, 165, 174, 0.15)",
    color: "var(--sl-silver)",
    border: "1px solid rgba(168, 165, 174, 0.25)",
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
