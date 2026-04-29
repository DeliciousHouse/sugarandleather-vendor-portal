import type { ApplicationStatus } from "@/generated/prisma/enums";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryArgs = any;

export type AdminApplicationRow = {
  id: string;
  status: ApplicationStatus;
  fullName: string;
  email: string;
  company: string | null;
  country: string;
  createdAt: Date;
};

export type ApplicationReviewDetail = AdminApplicationRow & {
  phone: string | null;
  promotionChannels: string[];
  aiTechExperience: string;
  audience: string;
  subjectiveAnswers: Record<string, string>;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
};

type ApplicationsQueryDb = {
  partnerApplication: {
    count(args: QueryArgs): Promise<number>;
    findMany(args: QueryArgs): Promise<AdminApplicationRow[]>;
    findUnique(args: QueryArgs): Promise<(ApplicationReviewDetail & { subjectiveAnswers: unknown }) | null>;
  };
};

export async function listAdminApplications(
  db: ApplicationsQueryDb,
  opts: { status?: string; page?: number; pageSize?: number } = {}
): Promise<{ applications: AdminApplicationRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;
  const where = opts.status ? { status: opts.status as ApplicationStatus } : {};

  const [applications, total] = await Promise.all([
    db.partnerApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        fullName: true,
        email: true,
        company: true,
        country: true,
        createdAt: true,
      },
    }),
    db.partnerApplication.count({ where }),
  ]);

  return {
    applications,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getApplicationReviewDetail(
  db: ApplicationsQueryDb,
  id: string
): Promise<ApplicationReviewDetail | null> {
  const app = await db.partnerApplication.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      fullName: true,
      email: true,
      phone: true,
      company: true,
      country: true,
      promotionChannels: true,
      aiTechExperience: true,
      audience: true,
      subjectiveAnswers: true,
      reviewedById: true,
      reviewedAt: true,
      reviewNotes: true,
      createdAt: true,
    },
  });

  if (!app) return null;
  return {
    ...app,
    subjectiveAnswers: app.subjectiveAnswers as Record<string, string>,
  };
}

export async function getApplicationMetadataTitle(
  db: ApplicationsQueryDb,
  id: string
): Promise<string | null> {
  const app = await db.partnerApplication.findUnique({
    where: { id },
    select: { fullName: true },
  });
  return app?.fullName ?? null;
}
