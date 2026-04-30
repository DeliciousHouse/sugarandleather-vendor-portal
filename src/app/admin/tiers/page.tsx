import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequiredAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminTiers } from "@/domain/tiers/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tiers · Admin · Sugar & Leather",
};

type Row = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  {
    key: "name",
    header: "Name",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[var(--sl-cream)]">{row.name}</span>
        {row.description ? (
          <span className="font-body text-xs text-[var(--sl-silver)]">
            {row.description}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    render: (row) => (
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.isDefault ? "Default" : "Custom"}
      </span>
    ),
  },
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
    key: "id",
    header: "",
    align: "right",
    render: (row) => (
      <Link
        href={`/admin/tiers/${row.id}`}
        className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
      >
        <span>Manage</span>
        <span aria-hidden className="h-px w-6 bg-[var(--sl-cream)] transition-all group-hover:w-10 group-hover:bg-[var(--sl-lavender)]" />
      </Link>
    ),
  },
];

export default async function AdminTiersPage() {
  try {
    await getRequiredAdmin();
  } catch {
    redirect("/login");
  }

  const tiers = await getAdminTiers(
    prisma as unknown as Parameters<typeof getAdminTiers>[0],
    { includeInactive: true },
  );

  const rows: (Row & Record<string, unknown>)[] = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    isDefault: t.isDefault,
    isActive: t.isActive,
  }));

  const active = tiers.filter((t) => t.isActive).length;

  return (
    <EditorialPageShell
      sectionLabel="02 / Tiers"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Tiers" },
      ]}
      eyebrow="Commission rules"
      headline={tiers.length === 0 ? "No tiers" : `${tiers.length} ${tiers.length === 1 ? "tier" : "tiers"}`}
      subheadline={tiers.length > 0 ? `${active} active` : undefined}
      actions={
        <Link
          href="/admin/tiers/new"
          className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
        >
          <span>New tier</span>
          <span aria-hidden className="h-px w-10 bg-[var(--sl-cream)] transition-all group-hover:w-16 group-hover:bg-[var(--sl-lavender)]" />
        </Link>
      }
      mainChildren={
        <EditorialTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          emptyMessage="No tiers found."
        />
      }
    />
  );
}
