import React from "react";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import { listAdminAgreements } from "@/domain/agreements/queries";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import EditorialTable, {
  type ColumnDef,
} from "@/components/brand/EditorialTable";
import EditorialStatusPill from "@/components/brand/EditorialStatusPill";
import EditorialFilterBar from "@/components/brand/EditorialFilterBar";
import EditorialPagination from "@/components/brand/EditorialPagination";
import AgreementActionsCell from "./AgreementActionsCell";

export const metadata = {
  title: "Agreements · Admin · Sugar & Leather",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  SIGNED: "Signed",
  VOIDED: "Voided",
  EXPIRED: "Expired",
};

const STATUSES = ["DRAFT", "SENT", "SIGNED", "VOIDED", "EXPIRED"];

type Row = {
  id: string;
  applicant: string;
  email: string;
  status: string;
  sentAt: string;
  signedAt: string;
  applicationId: string | null;
  signedEvidenceUrl: string | null;
  signedEvidenceNote: string | null;
};

const columns: ColumnDef<Row & Record<string, unknown>>[] = [
  {
    key: "applicant",
    header: "Applicant",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[var(--sl-cream)]">{row.applicant}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
          {row.email}
        </span>
      </div>
    ),
  },
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
    key: "sentAt",
    header: "Sent",
    align: "right",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.sentAt}
      </span>
    ),
  },
  {
    key: "signedAt",
    header: "Signed",
    align: "right",
    render: (row) => (
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--sl-silver)]">
        {row.signedAt}
      </span>
    ),
  },
  {
    key: "id",
    header: "Actions",
    align: "right",
    render: (row) => (
      <AgreementActionsCell
        agreementId={row.id}
        status={row.status}
        applicationId={row.applicationId ?? undefined}
        hasEvidence={!!(row.signedEvidenceUrl || row.signedEvidenceNote)}
      />
    ),
  },
];

export default async function AdminAgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await getRequiredAdmin();

  const { status, page: pageStr } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageStr ?? "1", 10));
  const { agreements, total, page, totalPages } = await listAdminAgreements(
    prisma as unknown as Parameters<typeof listAdminAgreements>[0],
    { status, page: requestedPage },
  );

  const rows: (Row & Record<string, unknown>)[] = agreements.map((a) => ({
    id: a.id,
    applicant: a.applicantName,
    email: a.applicantEmail,
    status: a.status,
    sentAt: a.sentAt ? a.sentAt.toLocaleDateString() : "—",
    signedAt: a.signedAt ? a.signedAt.toLocaleDateString() : "—",
    applicationId: a.applicationId ?? null,
    signedEvidenceUrl: a.signedEvidenceUrl ?? null,
    signedEvidenceNote: a.signedEvidenceNote ?? null,
  }));

  const filterOptions = [
    { label: "All", href: "/admin/agreements", active: !status },
    ...STATUSES.map((s) => ({
      label: STATUS_LABELS[s] ?? s,
      href: `/admin/agreements?status=${s}`,
      active: status === s,
    })),
  ];

  const buildPageHref = (p: number) =>
    `/admin/agreements?${status ? `status=${status}&` : ""}page=${p}`;

  return (
    <EditorialPageShell
      sectionLabel="02 / Agreements"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Agreements" },
      ]}
      eyebrow="Signature queue"
      headline={total === 0 ? "Nothing pending" : `${total} ${total === 1 ? "agreement" : "agreements"}`}
      subheadline={total > 0 ? `Showing page ${page} of ${totalPages}` : undefined}
      mainChildren={
        <div className="flex flex-col gap-8">
          <EditorialFilterBar options={filterOptions} />
          <EditorialTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.id}
            emptyMessage="No agreements match this filter."
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
