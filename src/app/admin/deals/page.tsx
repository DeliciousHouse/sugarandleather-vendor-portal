import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminDeals } from "@/domain/deals/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Deals · Admin · Sugar & Leather",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
  CANCELLED: "Cancelled",
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

type Row = {
  id: string;
  partnerId: string;
  productCode: string;
  packageCode: string | null;
  amount: string;
  status: string;
  closedAt: string;
  crmId: string;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  {
    key: "partnerId",
    header: "Partner",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.partnerId}
      </span>
    ),
  },
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
  { key: "amount", header: "Amount", align: "right" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.status}
        label={STATUS_LABELS[row.status] ?? row.status}
      />
    ),
  },
  {
    key: "closedAt",
    header: "Closed",
    align: "right",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.closedAt}
      </span>
    ),
  },
  {
    key: "crmId",
    header: "CRM ID",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.crmId}
      </span>
    ),
  },
  {
    key: "id",
    header: "",
    align: "right",
    render: (row) => (
      <Link
        href={`/admin/deals/${row.id}`}
        className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
      >
        <span>View</span>
        <span aria-hidden className="h-px w-6 bg-[var(--sl-cream)] transition-all group-hover:w-10 group-hover:bg-[var(--sl-lavender)]" />
      </Link>
    ),
  },
];

export default async function AdminDealsPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const deals = await getAdminDeals(
    prisma as unknown as Parameters<typeof getAdminDeals>[0],
  );

  const rows: (Row & Record<string, unknown>)[] = deals.map((d) => ({
    id: d.id,
    partnerId: d.partnerId,
    productCode: d.productCode,
    packageCode: d.packageCode ?? null,
    amount: formatCents(d.amountCents, d.currency),
    status: d.status,
    closedAt: d.closedAt ? new Date(d.closedAt).toLocaleDateString() : "—",
    crmId: d.externalCrmId ?? "—",
  }));

  const won = deals.filter((d) => d.status === "WON").length;

  return (
    <EditorialPageShell
      sectionLabel="02 / Deals"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Deals" },
      ]}
      eyebrow="Pipeline"
      headline={deals.length === 0 ? "No deals yet" : `${deals.length} ${deals.length === 1 ? "deal" : "deals"}`}
      subheadline={deals.length > 0 ? `${won} won this period` : undefined}
      mainChildren={
        <EditorialTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          emptyMessage="No deals yet."
        />
      }
    />
  );
}
