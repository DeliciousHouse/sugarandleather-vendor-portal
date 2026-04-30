import type { ReferralRow } from "@/components/referrals/ReferralStatusTable";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type AdminReferralRow = {
  id: string;
  partnerId: string;
  leadName: string;
  leadEmail: string | null;
  leadCompany: string | null;
  leadDomain: string | null;
  country: string | null;
  attributionKey: string;
  attributionStatus: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  submittedAt: Date;
};

// ---------------------------------------------------------------------------
// Partner referral list
// ---------------------------------------------------------------------------

type PartnerReferralDb = {
  referral: {
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: Record<string, unknown>;
      take?: number;
      skip?: number;
    }) => Promise<
      Array<{
        id: string;
        leadName: string;
        leadEmail: string | null;
        leadCompany: string | null;
        country: string | null;
        attributionStatus: string;
        status: string;
        submittedAt: Date;
      }>
    >;
  };
};

export async function getPartnerReferrals(
  db: PartnerReferralDb,
  partnerId: string,
  opts?: { take?: number; skip?: number }
): Promise<ReferralRow[]> {
  const rows = await db.referral.findMany({
    where: { partnerId },
    orderBy: { submittedAt: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
  });

  return rows.map((r) => ({
    id: r.id,
    leadName: r.leadName,
    leadEmail: r.leadEmail,
    leadCompany: r.leadCompany,
    country: r.country,
    attributionStatus: r.attributionStatus as ReferralRow["attributionStatus"],
    status: r.status as ReferralRow["status"],
    submittedAt: r.submittedAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Admin referral list
// ---------------------------------------------------------------------------

type AdminReferralDb = {
  referral: {
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: Record<string, unknown>;
      take?: number;
      skip?: number;
    }) => Promise<AdminReferralRow[]>;
    findUnique: (args: {
      where: { id: string };
    }) => Promise<AdminReferralRow | null>;
  };
};

export async function getAdminReferrals(
  db: AdminReferralDb,
  opts?: { status?: string; take?: number; skip?: number }
): Promise<AdminReferralRow[]> {
  const where = opts?.status ? { status: opts.status } : {};
  return db.referral.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
  });
}

export async function getAdminReferralById(
  db: AdminReferralDb,
  id: string
): Promise<AdminReferralRow | null> {
  return db.referral.findUnique({ where: { id } });
}
