// ---------------------------------------------------------------------------
// Dashboard query helpers — partner and admin read models
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

// ---------------------------------------------------------------------------
// Partner dashboard — types
// ---------------------------------------------------------------------------

export type PartnerReferralStatusCounts = {
  PENDING_REVIEW: number;
  APPROVED: number;
  REJECTED: number;
  CONVERTED: number;
  LOST: number;
  total: number;
};

export type PartnerDealRow = {
  id: string;
  referralId: string;
  productCode: string;
  packageCode: string | null;
  status: string;
  amountCents: number;
  currency: string;
  closedAt: Date | null;
  createdAt: Date;
};

export type PartnerEarningsRow = {
  id: string;
  dealId: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  tierNameSnapshot: string;
  payoutEligibleAt: Date;
  paidAt: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
};

export type PartnerEarningsSummary = {
  STAGED: number;
  PAYABLE: number;
  PAID: number;
  CLAWED_BACK: number;
  currency: string;
};

// ---------------------------------------------------------------------------
// Admin dashboard — types
// ---------------------------------------------------------------------------

export type AdminWorkQueueCounts = {
  applicationsPending: number;
  agreementsPending: number;
  referralsPending: number;
  commissionsPayable: number;
  payableAmountCents: number;
};

export type AdminAuditEventRow = {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  createdAt: Date;
};

export type AdminRevenueSnapshot = {
  totalDealsWon: number;
  totalRevenueCents: number;
  totalCommissionCents: number;
  currency: string;
};

// ---------------------------------------------------------------------------
// Partner dashboard — db interface
// ---------------------------------------------------------------------------

type PartnerDashboardDb = {
  referral: {
    count: (args: AnyArgs) => Promise<number>;
    findMany: (args: AnyArgs) => Promise<PartnerEarningsRow[]>;
  };
  deal: {
    findMany: (args: AnyArgs) => Promise<PartnerDealRow[]>;
  };
  commissionEvent: {
    findMany: (args: AnyArgs) => Promise<PartnerEarningsRow[]>;
  };
};

// ---------------------------------------------------------------------------
// Admin dashboard — db interface
// ---------------------------------------------------------------------------

type AdminDashboardDb = {
  partnerApplication: {
    count: (args: AnyArgs) => Promise<number>;
  };
  agreement: {
    count: (args: AnyArgs) => Promise<number>;
  };
  referral: {
    count: (args: AnyArgs) => Promise<number>;
  };
  commissionEvent: {
    count: (args: AnyArgs) => Promise<number>;
    findMany: (args: AnyArgs) => Promise<Array<{ status: string; amountCents: number; currency: string }>>;
  };
  deal: {
    count: (args: AnyArgs) => Promise<number>;
    findMany: (args: AnyArgs) => Promise<Array<{ amountCents: number; currency: string }>>;
  };
  auditLog: {
    findMany: (args: AnyArgs) => Promise<AdminAuditEventRow[]>;
  };
};

// ---------------------------------------------------------------------------
// Partner dashboard — queries
// ---------------------------------------------------------------------------

export async function getPartnerReferralStatusCounts(
  db: PartnerDashboardDb,
  partnerId: string
): Promise<PartnerReferralStatusCounts> {
  const [pending, approved, rejected, converted, lost] = await Promise.all([
    db.referral.count({ where: { partnerId, status: "PENDING_REVIEW" } }),
    db.referral.count({ where: { partnerId, status: "APPROVED" } }),
    db.referral.count({ where: { partnerId, status: "REJECTED" } }),
    db.referral.count({ where: { partnerId, status: "CONVERTED" } }),
    db.referral.count({ where: { partnerId, status: "LOST" } }),
  ]);

  return {
    PENDING_REVIEW: pending,
    APPROVED: approved,
    REJECTED: rejected,
    CONVERTED: converted,
    LOST: lost,
    total: pending + approved + rejected + converted + lost,
  };
}

export async function getPartnerReferralStatusCountsForPartner(
  partnerId: string
): Promise<PartnerReferralStatusCounts> {
  return getPartnerReferralStatusCounts(prisma as unknown as PartnerDashboardDb, partnerId);
}

export async function getPartnerDeals(
  db: PartnerDashboardDb,
  partnerId: string,
  opts?: { take?: number; skip?: number }
): Promise<PartnerDealRow[]> {
  return db.deal.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
    select: {
      id: true,
      referralId: true,
      productCode: true,
      packageCode: true,
      status: true,
      amountCents: true,
      currency: true,
      closedAt: true,
      createdAt: true,
    },
  });
}

export async function getPartnerDealsForPartner(
  partnerId: string,
  opts?: { take?: number; skip?: number }
): Promise<PartnerDealRow[]> {
  return getPartnerDeals(prisma as unknown as PartnerDashboardDb, partnerId, opts);
}

export async function getPartnerEarnings(
  db: PartnerDashboardDb,
  partnerId: string,
  opts?: { take?: number; skip?: number }
): Promise<PartnerEarningsRow[]> {
  return db.commissionEvent.findMany({
    where: {
      partnerId,
      status: { notIn: ["VOIDED"] },
    },
    orderBy: { payoutEligibleAt: "desc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
    select: {
      id: true,
      dealId: true,
      kind: true,
      status: true,
      amountCents: true,
      currency: true,
      tierNameSnapshot: true,
      payoutEligibleAt: true,
      paidAt: true,
      periodStart: true,
      periodEnd: true,
    },
  });
}

export async function getPartnerEarningsForPartner(
  partnerId: string,
  opts?: { take?: number; skip?: number }
): Promise<PartnerEarningsRow[]> {
  return getPartnerEarnings(prisma as unknown as PartnerDashboardDb, partnerId, opts);
}

export function summarisePartnerEarnings(
  events: PartnerEarningsRow[],
  currency = "USD"
): PartnerEarningsSummary {
  const sum = (status: string) =>
    events
      .filter((e) => e.status === status)
      .reduce((acc, e) => acc + e.amountCents, 0);

  return {
    STAGED: sum("STAGED"),
    PAYABLE: sum("PAYABLE"),
    PAID: sum("PAID"),
    CLAWED_BACK: sum("CLAWED_BACK"),
    currency,
  };
}

// ---------------------------------------------------------------------------
// Admin dashboard — queries
// ---------------------------------------------------------------------------

export async function getAdminWorkQueueCounts(
  db: AdminDashboardDb
): Promise<AdminWorkQueueCounts> {
  const [
    applicationsPending,
    agreementsPending,
    referralsPending,
    commissionsPayable,
    payableEvents,
  ] = await Promise.all([
    db.partnerApplication.count({
      where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } },
    }),
    db.agreement.count({ where: { status: "SENT" } }),
    db.referral.count({ where: { status: "PENDING_REVIEW" } }),
    db.commissionEvent.count({ where: { status: "PAYABLE" } }),
    db.commissionEvent.findMany({
      where: { status: "PAYABLE" },
      select: { amountCents: true },
    }),
  ]);

  const payableAmountCents = payableEvents.reduce(
    (sum, e) => sum + e.amountCents,
    0,
  );

  return {
    applicationsPending,
    agreementsPending,
    referralsPending,
    commissionsPayable,
    payableAmountCents,
  };
}

export async function getAdminDashboardWorkQueueCounts(): Promise<AdminWorkQueueCounts> {
  return getAdminWorkQueueCounts(prisma as unknown as AdminDashboardDb);
}

export async function getAdminRecentAuditEvents(
  db: AdminDashboardDb,
  opts?: { take?: number }
): Promise<AdminAuditEventRow[]> {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 15,
    select: {
      id: true,
      actorId: true,
      actorType: true,
      action: true,
      entityType: true,
      entityId: true,
      reason: true,
      createdAt: true,
    },
  });
}

export async function getAdminDashboardRecentAuditEvents(
  opts?: { take?: number }
): Promise<AdminAuditEventRow[]> {
  return getAdminRecentAuditEvents(prisma as unknown as AdminDashboardDb, opts);
}

export async function getAdminRevenueSnapshot(
  db: AdminDashboardDb,
  currency = "USD"
): Promise<AdminRevenueSnapshot> {
  const [wonDeals, commissions] = await Promise.all([
    db.deal.findMany({
      where: { status: "WON", currency },
      select: { amountCents: true, currency: true },
    }),
    db.commissionEvent.findMany({
      where: { currency, status: { notIn: ["VOIDED", "CLAWED_BACK"] } },
      select: { status: true, amountCents: true, currency: true },
    }),
  ]);

  const totalRevenueCents = wonDeals.reduce((s, d) => s + d.amountCents, 0);
  const totalCommissionCents = commissions.reduce((s, e) => s + e.amountCents, 0);

  return {
    totalDealsWon: wonDeals.length,
    totalRevenueCents,
    totalCommissionCents,
    currency,
  };
}


export async function getAdminDashboardRevenueSnapshot(
  currency = "USD"
): Promise<AdminRevenueSnapshot> {
  return getAdminRevenueSnapshot(prisma as unknown as AdminDashboardDb, currency);
}
