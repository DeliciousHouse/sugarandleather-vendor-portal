import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import { listAdminApplications } from "@/domain/applications/queries";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  REJECTED: "Rejected",
  APPROVED_PENDING_AGREEMENT: "Approved",
  AGREEMENT_SENT: "Agreement sent",
  SIGNED: "Signed",
  ACTIVATED: "Activated",
};

export const metadata = {
  title: "Applications — Admin — Sugar & Leather",
};

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await getRequiredAdmin();

  const { status, page: pageStr } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageStr ?? "1", 10));
  const {
    applications,
    total,
    page,
    totalPages,
  } = await listAdminApplications(prisma as unknown as Parameters<typeof listAdminApplications>[0], { status, page: requestedPage });

  const rows = applications.map((app) => ({
    id: app.id,
    name: app.fullName,
    email: app.email,
    company: app.company ?? "—",
    country: app.country,
    status: app.status,
    createdAt: app.createdAt.toLocaleDateString(),
  }));

  type Row = (typeof rows)[number];

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "company", header: "Company" },
    { key: "country", header: "Country" },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, row: Row) => (
        <StatusPill
          status={row.status}
          label={STATUS_LABELS[row.status] ?? row.status}
        />
      ),
    },
    { key: "createdAt", header: "Applied" },
    {
      key: "id",
      header: "",
      render: (_: unknown, row: Row) => (
        <Link
          href={`/admin/applications/${row.id}`}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--sl-lavender)" }}
        >
          Review →
        </Link>
      ),
    },
  ];

  const statuses = [
    "SUBMITTED",
    "IN_REVIEW",
    "APPROVED_PENDING_AGREEMENT",
    "AGREEMENT_SENT",
    "SIGNED",
    "ACTIVATED",
    "REJECTED",
  ];

  return (
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-8">
          <h1
            className="text-3xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--sl-cream)",
            }}
          >
            Applications
          </h1>
          <p className="text-sm" style={{ color: "var(--sl-mid-gray)" }}>
            {total} total
          </p>
        </div>

        {/* Status filter */}
        <nav
          className="flex flex-wrap gap-2 mb-6"
          aria-label="Filter by status"
        >
          <Link
            href="/admin/applications"
            className="px-3 py-1.5 text-sm rounded-full border transition-colors"
            style={{
              backgroundColor: !status
                ? "var(--accent-bg-subtle)"
                : "transparent",
              borderColor: "var(--border-dark)",
              color: "var(--sl-cream)",
            }}
          >
            All
          </Link>
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/admin/applications?status=${s}`}
              className="px-3 py-1.5 text-sm rounded-full border transition-colors"
              style={{
                backgroundColor:
                  status === s ? "var(--accent-bg-subtle)" : "transparent",
                borderColor: "var(--border-dark)",
                color: "var(--sl-cream)",
              }}
            >
              {STATUS_LABELS[s] ?? s}
            </Link>
          ))}
        </nav>

        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          data={rows as Record<string, unknown>[]}
          emptyMessage="No applications found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: "var(--sl-mid-gray)" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/applications?${status ? `status=${status}&` : ""}page=${page - 1}`}
                  className="px-3 py-1.5 text-sm rounded border"
                  style={{
                    borderColor: "var(--border-dark)",
                    color: "var(--sl-cream)",
                  }}
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/applications?${status ? `status=${status}&` : ""}page=${page + 1}`}
                  className="px-3 py-1.5 text-sm rounded border"
                  style={{
                    borderColor: "var(--border-dark)",
                    color: "var(--sl-cream)",
                  }}
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
