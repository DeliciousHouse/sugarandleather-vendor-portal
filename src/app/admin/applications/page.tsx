import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import { listAdminApplications } from "@/domain/applications/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
import EditorialFilterBar from "@/components/brand/EditorialFilterBar";
import EditorialPagination from "@/components/brand/EditorialPagination";

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  REJECTED: "Rejected",
  APPROVED_PENDING_AGREEMENT: "Approved",
  AGREEMENT_SENT: "Agreement sent",
  SIGNED: "Signed",
  ACTIVATED: "Activated",
};

const STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED_PENDING_AGREEMENT",
  "AGREEMENT_SENT",
  "SIGNED",
  "ACTIVATED",
  "REJECTED",
];

export const metadata = {
  title: "Applications · Admin · Sugar & Leather",
};

type Row = {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  status: string;
  createdAt: string;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  {
    key: "name",
    header: "Name",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[var(--sl-cream)]">{row.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
          {row.email}
        </span>
      </div>
    ),
  },
  { key: "company", header: "Company" },
  { key: "country", header: "Country" },
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
    key: "createdAt",
    header: "Applied",
    align: "right",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.createdAt}
      </span>
    ),
  },
  {
    key: "id",
    header: "",
    align: "right",
    render: (row) => (
      <Link
        href={`/admin/applications/${row.id}`}
        className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-cream)] hover:text-[var(--sl-lavender)] transition-colors"
      >
        <span>Review</span>
        <span
          aria-hidden
          className="h-px w-6 bg-[var(--sl-cream)] transition-all group-hover:w-10 group-hover:bg-[var(--sl-lavender)]"
        />
      </Link>
    ),
  },
];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await getRequiredAdmin();

  const { status, page: pageStr } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageStr ?? "1", 10));
  const { applications, total, page, totalPages } = await listAdminApplications(
    prisma as unknown as Parameters<typeof listAdminApplications>[0],
    { status, page: requestedPage },
  );

  const rows: (Row & Record<string, unknown>)[] = applications.map((app) => ({
    id: app.id,
    name: app.fullName,
    email: app.email,
    company: app.company ?? "—",
    country: app.country,
    status: app.status,
    createdAt: app.createdAt.toLocaleDateString(),
  }));

  const filterOptions = [
    { label: "All", href: "/admin/applications", active: !status },
    ...STATUSES.map((s) => ({
      label: STATUS_LABELS[s] ?? s,
      href: `/admin/applications?status=${s}`,
      active: status === s,
    })),
  ];

  const buildPageHref = (p: number) =>
    `/admin/applications?${status ? `status=${status}&` : ""}page=${p}`;

  return (
    <EditorialPageShell
      sectionLabel="02 / Applications"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Applications" },
      ]}
      eyebrow="Inbox"
      headline={total === 0 ? "Inbox is clear" : `${total} ${total === 1 ? "application" : "applications"}`}
      subheadline={total > 0 ? `Showing page ${page} of ${totalPages}` : undefined}
      mainChildren={
        <div className="flex flex-col gap-8">
          <EditorialFilterBar options={filterOptions} />
          <EditorialTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            emptyMessage="No applications match this filter."
          />
          <EditorialPagination
            page={page}
            totalPages={totalPages}
            buildHref={buildPageHref}
          />
        </div>
      }
    />
  );
}
