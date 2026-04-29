import React from "react";
import { redirect } from "next/navigation";
import { getRequiredActivePartner } from "@/lib/auth";
import { getPartnerDealsForPartner } from "@/domain/dashboard/queries";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Deals — Partner — Sugar & Leather",
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

  const rows = deals.map((deal) => ({
    id: deal.id,
    referralId: deal.referralId,
    product: deal.packageCode ? `${deal.productCode} / ${deal.packageCode}` : deal.productCode,
    status: deal.status,
    amount: formatCents(deal.amountCents, deal.currency),
    closedAt: deal.closedAt ? deal.closedAt.toLocaleDateString() : "—",
    createdAt: deal.createdAt.toLocaleDateString(),
  }));

  type Row = (typeof rows)[number];

  const columns = [
    { key: "product", header: "Product" },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, row: Row) => (
        <StatusPill status={row.status} label={DEAL_STATUS_LABELS[row.status] ?? row.status} />
      ),
    },
    { key: "amount", header: "Amount" },
    { key: "closedAt", header: "Closed" },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
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
              My deals
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--sl-silver)" }}>
              Deals associated with your approved referrals.
            </p>
          </div>
          <p className="text-sm" style={{ color: "var(--sl-mid-gray)" }}>
            {deals.length} deal{deals.length !== 1 ? "s" : ""}
          </p>
        </div>

        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          data={rows as unknown as Parameters<typeof DataTable>[0]["data"]}
          emptyMessage="No deals yet. Deals appear once your approved referrals are converted."
        />
      </div>
    </main>
  );
}

