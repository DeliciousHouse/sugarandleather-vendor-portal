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
    backgroundColor: "var(--sl-lavender)",
    color: "var(--sl-obsidian)",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "var(--sl-charcoal)",
    color: "var(--sl-cream)",
    border: "1px solid var(--border-dark)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--sl-cream)",
    border: "1px solid var(--border-dark)",
  },
  danger: {
    backgroundColor: "var(--status-danger-strong-bg)",
    color: "var(--sl-warm-white)",
    border: "1px solid transparent",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded",
  md: "px-4 py-2 text-base rounded-md",
  lg: "px-6 py-3 text-lg rounded-lg",
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
    "inline-flex items-center justify-center font-medium transition-opacity cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

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
