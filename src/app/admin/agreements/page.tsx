import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import { listAdminAgreements } from "@/domain/agreements/queries";
import DataTable from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import AgreementActionsCell from "./AgreementActionsCell";

export const metadata = {
  title: "Agreements — Admin — Sugar & Leather",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  SIGNED: "Signed",
  VOIDED: "Voided",
  EXPIRED: "Expired",
};

export default async function AdminAgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await getRequiredAdmin();

  const { status, page: pageStr } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageStr ?? "1", 10));
  const {
    agreements,
    total,
    page,
    totalPages,
  } = await listAdminAgreements(prisma as unknown as Parameters<typeof listAdminAgreements>[0], { status, page: requestedPage });

  const rows = agreements.map((a) => ({
    id: a.id,
    applicant: a.applicantName,
    email: a.applicantEmail,
    status: a.status,
    sentAt: a.sentAt ? a.sentAt.toLocaleDateString() : "—",
    signedAt: a.signedAt ? a.signedAt.toLocaleDateString() : "—",
    applicationId: a.applicationId,
    signedEvidenceUrl: a.signedEvidenceUrl,
    signedEvidenceNote: a.signedEvidenceNote,
  }));

  type Row = (typeof rows)[number];

  const columns = [
    { key: "applicant", header: "Applicant" },
    { key: "email", header: "Email" },
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
    { key: "sentAt", header: "Sent" },
    { key: "signedAt", header: "Signed" },
    {
      key: "id",
      header: "Actions",
      render: (_: unknown, row: Row) => (
        <AgreementActionsCell
          agreementId={row.id}
          status={row.status}
          applicationId={row.applicationId ?? undefined}
          hasEvidence={
            !!(row.signedEvidenceUrl || row.signedEvidenceNote)
          }
        />
      ),
    },
  ];

  const statuses = ["DRAFT", "SENT", "SIGNED", "VOIDED", "EXPIRED"];

  return (
    <main
      className="min-h-screen py-10 px-6"
      style={{ backgroundColor: "var(--surface-root)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--sl-cream)",
            }}
          >
            Agreements
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
            href="/admin/agreements"
            className="px-3 py-1.5 text-sm rounded-full border"
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
              href={`/admin/agreements?status=${s}`}
              className="px-3 py-1.5 text-sm rounded-full border"
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
          emptyMessage="No agreements found"
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: "var(--sl-mid-gray)" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/agreements?${status ? `status=${status}&` : ""}page=${page - 1}`}
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
                  href={`/admin/agreements?${status ? `status=${status}&` : ""}page=${page + 1}`}
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
