import React from "react";
import Link from "next/link";
import type { AdminWorkQueueCounts } from "@/domain/dashboard/queries";

interface QueueItem {
  label: string;
  count: number;
  href: string;
  accentColor: string;
  emptyLabel: string;
}

interface AdminWorkQueueProps {
  counts: AdminWorkQueueCounts;
}

export default function AdminWorkQueue({ counts }: AdminWorkQueueProps) {
  const items: QueueItem[] = [
    {
      label: "Applications pending review",
      count: counts.applicationsPending,
      href: "/admin/applications?status=SUBMITTED",
      accentColor: "var(--status-warning-text)",
      emptyLabel: "No applications pending",
    },
    {
      label: "Agreements awaiting signature",
      count: counts.agreementsPending,
      href: "/admin/agreements",
      accentColor: "var(--sl-lavender)",
      emptyLabel: "No agreements awaiting",
    },
    {
      label: "Referrals pending approval",
      count: counts.referralsPending,
      href: "/admin/referrals?status=PENDING_REVIEW",
      accentColor: "var(--status-warning-text)",
      emptyLabel: "No referrals pending",
    },
    {
      label: "Payable commissions",
      count: counts.commissionsPayable,
      href: "/admin/payouts",
      accentColor: "var(--status-success-text)",
      emptyLabel: "No payable commissions",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sl-lavender)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sl-obsidian)] rounded-xl"
          style={{ textDecoration: "none", display: "block" }}
        >
          <div
            style={{
              backgroundColor: "var(--surface-panel)",
              border: "1px solid var(--border-dark)",
              borderRadius: "0.75rem",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
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
              {item.label}
            </span>
            {item.count > 0 ? (
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-heading)",
                  color: item.accentColor,
                  lineHeight: 1,
                }}
              >
                {item.count}
              </span>
            ) : (
              <span style={{ fontSize: "0.875rem", color: "var(--sl-mid-gray)" }}>
                {item.emptyLabel}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
