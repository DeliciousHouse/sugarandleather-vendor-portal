import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import { getPartnerReferralStatusCountsForPartner } from "@/domain/dashboard/queries";
import MetricCard from "@/components/dashboard/MetricCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Partner — Sugar & Leather",
};

export default async function PartnerDashboardPage() {
  let actor: Awaited<ReturnType<typeof getRequiredActivePartner>>;
  try {
    actor = await getRequiredActivePartner();
  } catch {
    redirect("/login");
  }

  if (!actor.partnerId) {
    redirect("/partner/pending");
  }

  const counts = await getPartnerReferralStatusCountsForPartner(actor.partnerId);

  return (
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-5xl mx-auto" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "0.25rem",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
            Your referral activity at a glance.
          </p>
        </div>

        {/* Referral counts */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--sl-cream)",
              letterSpacing: "0.01em",
            }}
          >
            Referrals
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
            }}
          >
            <MetricCard label="Total" value={counts.total} variant="neutral" />
            <MetricCard label="Pending review" value={counts.PENDING_REVIEW} variant="warning" />
            <MetricCard label="Approved" value={counts.APPROVED} variant="success" />
            <MetricCard label="Converted" value={counts.CONVERTED} variant="success" />
            <MetricCard label="Rejected" value={counts.REJECTED} variant="danger" />
            <MetricCard label="Lost" value={counts.LOST} variant="neutral" />
          </div>
          <div>
            <Link
              href="/partner/referrals"
              style={{
                fontSize: "0.875rem",
                color: "var(--sl-lavender)",
                fontWeight: 500,
              }}
            >
              View all referrals →
            </Link>
          </div>
        </section>

        {/* Quick navigation */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--sl-cream)",
              letterSpacing: "0.01em",
            }}
          >
            Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <Link href="/partner/deals" style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: "var(--surface-panel)",
                  border: "1px solid var(--border-dark)",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--sl-cream)",
                  }}
                >
                  My deals
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--sl-silver)" }}>
                  Track deal statuses and closed revenue.
                </span>
              </div>
            </Link>
            <Link href="/partner/earnings" style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: "var(--surface-panel)",
                  border: "1px solid var(--border-dark)",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--sl-cream)",
                  }}
                >
                  My earnings
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--sl-silver)" }}>
                  View staged, payable, and paid commissions.
                </span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

