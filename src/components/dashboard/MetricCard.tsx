import React from "react";
import Link from "next/link";

export type MetricCardVariant = "neutral" | "success" | "warning" | "danger";

const variantValueColor: Record<MetricCardVariant, string> = {
  neutral: "var(--sl-cream)",
  success: "var(--status-success-text)",
  warning: "var(--status-warning-text)",
  danger: "var(--status-danger-text)",
};

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: MetricCardVariant;
  href?: string;
}

export default function MetricCard({
  label,
  value,
  sublabel,
  variant = "neutral",
  href,
}: MetricCardProps) {
  const inner = (
    <div
      style={{
        backgroundColor: "var(--surface-panel)",
        border: "1px solid var(--border-dark)",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
        transition: "background-color 0.15s",
      }}
    >
      <span
        style={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--sl-silver)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          fontFamily: "var(--font-heading)",
          color: variantValueColor[variant],
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {sublabel && (
        <span style={{ fontSize: "0.8125rem", color: "var(--sl-mid-gray)" }}>
          {sublabel}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }

  return inner;
}
