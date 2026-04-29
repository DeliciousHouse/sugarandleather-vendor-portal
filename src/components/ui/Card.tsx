import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${className}`}
      style={{
        backgroundColor: "var(--surface-panel)",
        borderColor: "var(--border-dark)",
        color: "var(--text-primary-dark)",
      }}
    >
      {children}
    </div>
  );
}
