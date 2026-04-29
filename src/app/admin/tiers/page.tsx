import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminTiers } from "@/domain/tiers/queries";

export const dynamic = "force-dynamic";

export default async function AdminTiersPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const tiers = await getAdminTiers(
    prisma as unknown as Parameters<typeof getAdminTiers>[0],
    { includeInactive: true }
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
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
              Partner Tiers
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
              Manage tier definitions and commission rules.
            </p>
          </div>
          <Link
            href="/admin/tiers/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              backgroundColor: "var(--sl-lavender)",
              color: "var(--sl-obsidian)",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            + New Tier
          </Link>
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
                {["Name", "Type", "Status", ""].map((h) => (
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
              {tiers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      color: "var(--sl-mid-gray)",
                    }}
                  >
                    No tiers found.
                  </td>
                </tr>
              ) : (
                tiers.map((tier, i) => (
                  <tr
                    key={tier.id}
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? "var(--surface-panel)" : "var(--sl-charcoal)",
                      borderBottom: "1px solid var(--border-dark)",
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: "var(--sl-cream)",
                        }}
                      >
                        {tier.name}
                      </div>
                      {tier.description && (
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--sl-silver)",
                            marginTop: "0.125rem",
                          }}
                        >
                          {tier.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--sl-silver)" }}>
                      {tier.isDefault ? (
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
                      ) : (
                        <span style={{ color: "var(--sl-mid-gray)" }}>Custom</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
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
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link
                        href={`/admin/tiers/${tier.id}`}
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--sl-lavender)",
                          textDecoration: "none",
                        }}
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
