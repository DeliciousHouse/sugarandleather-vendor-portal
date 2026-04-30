import React from "react";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import { getPartnerDealsForPartner } from "@/domain/dashboard/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Deals · Partner · Sugar & Leather",
};

const DEAL_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
  CANCELLED: "Cancelled",
};

function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type Row = {
  id: string;
  product: string;
  status: string;
  amount: string;
  closedAt: string;
  createdAt: string;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  { key: "product", header: "Product" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <EditorialStatusPill
        status={row.status}
        label={DEAL_STATUS_LABELS[row.status] ?? row.status}
      />
    ),
  },
  { key: "amount", header: "Amount", align: "right" },
  { key: "closedAt", header: "Closed", align: "right" },
  { key: "createdAt", header: "Created", align: "right" },
];

export default async function PartnerDealsPage() {
  let actor: Awaited<ReturnType<typeof getRequiredActivePartner>>;
  try {
    actor = await getRequiredActivePartner();
  } catch {
    redirect("/login");
  }

  if (!actor.partnerId) {
    redirect("/partner/pending");
  }

  const deals = await getPartnerDealsForPartner(actor.partnerId);

  const rows: (Row & Record<string, unknown>)[] = deals.map((deal) => ({
    id: deal.id,
    product: deal.packageCode
      ? `${deal.productCode} / ${deal.packageCode}`
      : deal.productCode,
    status: deal.status,
    amount: formatCents(deal.amountCents, deal.currency),
    closedAt: deal.closedAt ? deal.closedAt.toLocaleDateString() : "—",
    createdAt: deal.createdAt.toLocaleDateString(),
  }));

  return (
    <EditorialPageShell
      sectionLabel="02 / Deals"
      crumbs={[
        { label: "Partner", href: "/partner" },
        { label: "Deals" },
      ]}
      eyebrow="Closed work"
      headline={
        deals.length === 0 ? (
          "No deals yet"
        ) : (
          <>
            {deals.length} {deals.length === 1 ? "deal" : "deals"}
          </>
        )
      }
      subheadline={
        deals.length === 0
          ? "Approved referrals appear here once converted."
          : `${deals.filter((d) => d.status === "WON").length} won this period`
      }
      mainChildren={
        <EditorialTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          emptyMessage="No deals yet. Approved referrals appear here once converted."
        />
      }
    />
  );
}
