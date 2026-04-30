import type { AgreementStatus } from "@/generated/prisma/enums";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryArgs = any;

type RawAgreement = {
  id: string;
  status: AgreementStatus;
  applicationId: string | null;
  ndaVersion: string;
  agreementVersion: string;
  sentAt: Date | null;
  signedAt: Date | null;
  signedEvidenceUrl: string | null;
  signedEvidenceNote: string | null;
  createdAt: Date;
};

type ApplicationIdentity = {
  id: string;
  fullName: string;
  email: string;
};

export type AdminAgreementRow = {
  id: string;
  status: AgreementStatus;
  applicationId: string | null;
  applicantName: string;
  applicantEmail: string;
  ndaVersion: string;
  agreementVersion: string;
  sentAt: Date | null;
  signedAt: Date | null;
  signedEvidenceUrl: string | null;
  signedEvidenceNote: string | null;
};

type AgreementsQueryDb = {
  agreement: {
    count(args: QueryArgs): Promise<number>;
    findMany(args: QueryArgs): Promise<RawAgreement[]>;
  };
  partnerApplication: {
    findMany(args: QueryArgs): Promise<ApplicationIdentity[]>;
  };
};

export async function listAdminAgreements(
  db: AgreementsQueryDb,
  opts: { status?: string; page?: number; pageSize?: number } = {}
): Promise<{ agreements: AdminAgreementRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;
  const where = opts.status ? { status: opts.status as AgreementStatus } : {};

  const [rawAgreements, total] = await Promise.all([
    db.agreement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.agreement.count({ where }),
  ]);

  const applicationIds = rawAgreements
    .map((agreement) => agreement.applicationId)
    .filter(Boolean) as string[];

  const applications = applicationIds.length
    ? await db.partnerApplication.findMany({
        where: { id: { in: applicationIds } },
        select: { id: true, fullName: true, email: true },
      })
    : [];

  const appMap = new Map(applications.map((application) => [application.id, application]));
  const agreements = rawAgreements.map((agreement) => {
    const application = agreement.applicationId ? appMap.get(agreement.applicationId) : null;
    return {
      id: agreement.id,
      status: agreement.status,
      applicationId: agreement.applicationId,
      applicantName: application?.fullName ?? "—",
      applicantEmail: application?.email ?? "—",
      ndaVersion: agreement.ndaVersion,
      agreementVersion: agreement.agreementVersion,
      sentAt: agreement.sentAt,
      signedAt: agreement.signedAt,
      signedEvidenceUrl: agreement.signedEvidenceUrl,
      signedEvidenceNote: agreement.signedEvidenceNote,
    };
  });

  return {
    agreements,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
