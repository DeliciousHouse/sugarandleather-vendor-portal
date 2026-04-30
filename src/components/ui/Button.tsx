import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--sl-cream)",
    color: "var(--sl-obsidian)",
    border: "1px solid var(--sl-cream)",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--sl-cream)",
    border: "1px solid var(--sl-cream)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--sl-cream)",
    border: "1px solid var(--border-dark)",
  },
  danger: {
    backgroundColor: "transparent",
    color: "var(--status-danger-text)",
    border: "1px solid var(--status-danger-border)",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-[10px] tracking-[0.32em]",
  md: "px-6 py-3 text-[11px] tracking-[0.32em]",
  lg: "px-8 py-4 text-[12px] tracking-[0.32em]",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-mono uppercase rounded-sm transition-opacity cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sl-lavender)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sl-obsidian)]";

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
