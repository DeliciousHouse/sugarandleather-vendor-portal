import React from "react";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

const variantStyles: Record<LogoVariant, React.CSSProperties> = {
  light: { color: "var(--sl-cream)" },
  dark: { color: "var(--sl-obsidian)" },
};

export default function Logo({
  variant = "light",
  size = "md",
  className = "",
}: LogoProps) {
  return (
    <span
      className={`font-serif tracking-wide ${sizeClasses[size]} ${className}`}
      style={{
        ...variantStyles[variant],
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      Sugar &amp; Leather
    </span>
  );
}
