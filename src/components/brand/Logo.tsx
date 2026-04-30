import React from "react";
import Image from "next/image";

type LogoVariant = "cream" | "obsidian";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  withWordmark?: boolean;
  className?: string;
}

const markPx: Record<LogoSize, number> = { sm: 28, md: 40, lg: 64 };
const wordmarkClass: Record<LogoSize, string> = {
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-sm",
};

export default function Logo({
  variant = "cream",
  size = "md",
  withWordmark = false,
  className = "",
}: LogoProps) {
  const px = markPx[size];
  const src =
    variant === "cream" ? "/brand/logo-cream.png" : "/brand/logo-obsidian.png";
  const wordmarkColor =
    variant === "cream" ? "text-[var(--sl-cream)]" : "text-[var(--sl-obsidian)]";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src={src}
        alt="Sugar & Leather"
        width={px}
        height={px}
        priority
        className="shrink-0"
      />
      {withWordmark ? (
        <span
          className={`font-mono uppercase tracking-[0.32em] ${wordmarkColor} ${wordmarkClass[size]}`}
        >
          Sugar &amp; Leather AI
        </span>
      ) : null}
    </span>
  );
}
