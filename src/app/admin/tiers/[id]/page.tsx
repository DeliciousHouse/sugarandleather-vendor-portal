import React from "react";
import { notFound, redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminTierById } from "@/domain/tiers/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
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

type RuleRow = {
  id: string;
  productCode: string;
  packageCode: string | null;
  kind: string;
  rate: string;
  trailing: string;
  delay: string;
  clawback: string;
  minReferrals: string;
  isActive: boolean;
};

const ruleColumns: ColumnDef<RuleRow & Record<string, unknown>>[] = [
  {
    key: "productCode",
    header: "Product",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[var(--sl-cream)]">{row.productCode}</span>
        {row.packageCode ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
            {row.packageCode}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    key: "kind",
    header: "Kind",
    render: (row) => KIND_LABELS[row.kind] ?? row.kind,
  },
  { key: "rate", header: "Rate", align: "right" },
  { key: "trailing", header: "Trailing" },
  { key: "delay", header: "Delay" },
  { key: "clawback", header: "Clawback" },
  { key: "minReferrals", header: "Min refs", align: "right" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.isActive ? "ACTIVE" : "INACTIVE"}
        label={row.isActive ? "Active" : "Inactive"}
        tone={row.isActive ? "success" : "neutral"}
      />
    ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (row) =>
      row.isActive ? (
        <TierRuleEditor mode="deactivate-rule" ruleId={row.id} />
      ) : null,
  },
];

export default async function AdminTierDetailPage({ params }: PageProps) {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const { id } = await params;

  if (id === "new") {
    return (
      <EditorialPageShell
        sectionLabel="03 / New tier"
        crumbs={[
          { label: "Tiers", href: "/admin/tiers" },
          { label: "New" },
        ]}
        eyebrow="Create"
        headline="New tier"
        subheadline="Define name and description first; rules come next"
        mainChildren={
          <div className="max-w-2xl">
            <TierRuleEditor mode="create" />
          </div>
        }
      />
    );
  }

  const tier = await getAdminTierById(
    prisma as unknown as Parameters<typeof getAdminTierById>[0],
    id,
  );

  if (!tier) {
    notFound();
  }

  const rows: (RuleRow & Record<string, unknown>)[] = tier.rules.map((rule) => ({
    id: rule.id,
    productCode: rule.productCode,
    packageCode: rule.packageCode ?? null,
    kind: rule.kind,
    rate:
      rule.percentBps != null
        ? formatBps(rule.percentBps)
        : rule.flatAmountCents != null
          ? formatCents(rule.flatAmountCents)
          : "—",
    trailing: rule.trailingMonths != null ? `${rule.trailingMonths}mo` : "—",
    delay: `${rule.payoutDelayDays}d`,
    clawback: `${rule.clawbackWindowDays}d`,
    minReferrals: rule.quarterlyMinReferrals?.toString() ?? "—",
    isActive: rule.isActive,
  }));

  return (
    <EditorialPageShell
      sectionLabel="03 / Tier"
      split="6/6"
      crumbs={[
        { label: "Tiers", href: "/admin/tiers" },
        { label: tier.name },
      ]}
      eyebrow="Commission rules"
      headline={tier.name}
      subheadline={
        tier.description ??
        `${tier._count.partners} partner${tier._count.partners !== 1 ? "s" : ""}`
      }
      actions={
        <div className="flex items-center gap-3">
          <EditorialStatusPill
            status={tier.isActive ? "ACTIVE" : "INACTIVE"}
            label={tier.isActive ? "Active" : "Inactive"}
            tone={tier.isActive ? "success" : "neutral"}
          />
          {tier.isDefault ? (
            <EditorialStatusPill
              status="DEFAULT"
              label="Default"
              tone="info"
            />
          ) : null}
        </div>
      }
      mainChildren={
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[var(--border-dark)] pb-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Rules
            </h2>
            <TierRuleEditor mode="add-rule" tierId={tier.id} />
          </div>
          <EditorialTable
            columns={ruleColumns}
            data={rows}
            rowKey={(row) => row.id}
            emptyMessage="No commission rules yet. Add a rule above."
          />
        </div>
      }
      sideChildren={
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
              Tier
            </h2>
            <TierRuleEditor
              mode="edit"
              tierId={tier.id}
              initialName={tier.name}
              initialDescription={tier.description ?? ""}
            />
          </div>
          {tier.isActive && !tier.isDefault ? (
            <div>
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
                Deactivate
              </h2>
              <TierRuleEditor
                mode="deactivate"
                tierId={tier.id}
                partnerCount={tier._count.partners}
              />
            </div>
          ) : null}
        </div>
      }
    />
  );
}
