import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminTierById } from "@/domain/tiers/queries";
import TierRuleEditor from "@/components/tiers/TierRuleEditor";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const KIND_LABELS: Record<string, string> = {
  UPFRONT: "Upfront",
  TRAILING: "Trailing",
  CLAWBACK: "Clawback",
  ADJUSTMENT: "Adjustment",
};

function formatBps(bps: number | null): string {
  if (bps == null) return "—";
  return `${(bps / 100).toFixed(2)}%`;
}

function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function cellStyle(color = "var(--sl-cream)"): React.CSSProperties {
  return { padding: "0.75rem 1rem", color };
}

export default async function AdminTierDetailPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;

  // Support /admin/tiers/new as a "create" route using this page
  if (id === "new") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--surface-root)",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <Link
            href="/admin/tiers"
            style={{
              fontSize: "0.875rem",
              color: "var(--sl-silver)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "1.5rem",
            }}
          >
            ← Tiers
          </Link>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--sl-cream)",
              marginBottom: "1.5rem",
            }}
          >
            New Tier
          </h1>
          <TierRuleEditor mode="create" />
        </div>
      </div>
    );
  }

  const tier = await getAdminTierById(
    prisma as unknown as Parameters<typeof getAdminTierById>[0],
    id
  );

  if (!tier) {
    notFound();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <Link
          href="/admin/tiers"
          style={{
            fontSize: "0.875rem",
            color: "var(--sl-silver)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "1.5rem",
          }}
        >
          ← Tiers
        </Link>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
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
              {tier.name}
            </h1>
            {tier.description && (
              <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
                {tier.description}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              {tier.isDefault && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(197,184,212,0.15)",
                    color: "var(--sl-lavender)",
                  }}
                >
                  Default
                </span>
              )}
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: tier.isActive
                    ? "rgba(74,222,128,0.12)"
                    : "rgba(107,101,112,0.2)",
                  color: tier.isActive ? "#4ade80" : "var(--sl-mid-gray)",
                }}
              >
                {tier.isActive ? "Active" : "Inactive"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--sl-mid-gray)" }}>
                {tier._count.partners} partner{tier._count.partners !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Edit / Deactivate actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <TierRuleEditor
              mode="edit"
              tierId={tier.id}
              initialName={tier.name}
              initialDescription={tier.description ?? ""}
            />
            {tier.isActive && !tier.isDefault && (
              <TierRuleEditor
                mode="deactivate"
                tierId={tier.id}
                partnerCount={tier._count.partners}
              />
            )}
          </div>
        </div>

        {/* Commission rules table */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--sl-cream)",
              }}
            >
              Commission Rules
            </h2>
            <TierRuleEditor mode="add-rule" tierId={tier.id} />
          </div>

          <div
            style={{
              width: "100%",
              overflowX: "auto",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-dark)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--sl-obsidian)",
                    borderBottom: "1px solid var(--border-dark)",
                  }}
                >
                  {[
                    "Product",
                    "Kind",
                    "Rate",
                    "Trailing",
                    "Delay",
                    "Clawback",
                    "Min Referrals",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "var(--sl-silver)",
                        letterSpacing: "0.025em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tier.rules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: "3rem 1rem",
                        textAlign: "center",
                        color: "var(--sl-mid-gray)",
                      }}
                    >
                      No commission rules yet. Add a rule above.
                    </td>
                  </tr>
                ) : (
                  tier.rules.map((rule, i) => (
                    <tr
                      key={rule.id}
                      style={{
                        backgroundColor:
                          i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                        borderBottom: "1px solid var(--border-dark)",
                      }}
                    >
                      <td style={cellStyle()}>
                        <div style={{ fontWeight: 500 }}>{rule.productCode}</div>
                        {rule.packageCode && (
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--sl-silver)",
                            }}
                          >
                            {rule.packageCode}
                          </div>
                        )}
                      </td>
                      <td style={cellStyle("var(--sl-silver)")}>
                        {KIND_LABELS[rule.kind] ?? rule.kind}
                      </td>
                      <td
                        style={{
                          ...cellStyle(),
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {rule.percentBps != null
                          ? formatBps(rule.percentBps)
                          : rule.flatAmountCents != null
                            ? formatCents(rule.flatAmountCents)
                            : "—"}
                      </td>
                      <td style={cellStyle("var(--sl-silver)")}>
                        {rule.trailingMonths != null ? `${rule.trailingMonths}mo` : "—"}
                      </td>
                      <td style={cellStyle("var(--sl-silver)")}>
                        {rule.payoutDelayDays}d
                      </td>
                      <td style={cellStyle("var(--sl-silver)")}>
                        {rule.clawbackWindowDays}d
                      </td>
                      <td style={cellStyle("var(--sl-silver)")}>
                        {rule.quarterlyMinReferrals ?? "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.125rem 0.5rem",
                            borderRadius: "9999px",
                            backgroundColor: rule.isActive
                              ? "rgba(74,222,128,0.12)"
                              : "rgba(107,101,112,0.2)",
                            color: rule.isActive ? "#4ade80" : "var(--sl-mid-gray)",
                          }}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {rule.isActive && (
                          <TierRuleEditor
                            mode="deactivate-rule"
                            ruleId={rule.id}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
