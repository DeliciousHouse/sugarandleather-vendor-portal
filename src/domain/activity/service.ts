import { createAuditWriter, type AuditClient } from "@/lib/audit";
import { requireAdmin, type SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type QuarterlyActivitySnapshotRow = {
  id: string;
  partnerId: string;
  quarter: string;
  referralsSubmitted: number;
  referralsApproved: number;
  dealsWon: number;
  revenueCents: number;
  commissionCents: number;
  overrideStatus: string | null;
  overrideReason: string | null;
  generatedAt: Date;
};

export type ActivityDb = AuditClient & {
  referral: {
    count: (args: AnyArgs) => Promise<number>;
  };
  deal: {
    findMany: (args: AnyArgs) => Promise<Array<{ amountCents: number }>>;
    count: (args: AnyArgs) => Promise<number>;
  };
  commissionEvent: {
    findMany: (args: AnyArgs) => Promise<Array<{ amountCents: number; kind: string }>>;
  };
  commissionRule: {
    findMany: (args: AnyArgs) => Promise<
      Array<{ id: string; quarterlyMinReferrals: number | null; isActive: boolean }>
    >;
  };
  partner: {
    findUnique: (args: AnyArgs) => Promise<{ id: string; tierId: string } | null>;
  };
  quarterlyActivitySnapshot: {
    findUnique: (args: AnyArgs) => Promise<QuarterlyActivitySnapshotRow | null>;
    upsert: (args: AnyArgs) => Promise<QuarterlyActivitySnapshotRow>;
  };
};

export type ActivityServiceDeps = {
  db: ActivityDb;
  actor: SessionUser;
};

export type QuarterlyActivityResult = {
  partnerId: string;
  quarter: string;
  referralsSubmitted: number;
  referralsApproved: number;
  dealsWon: number;
  revenueCents: number;
  commissionCents: number;
};

export type TierComplianceResult = {
  meetsRequirements: boolean;
  minimumReferralsRequired: number | null;
  referralsApproved: number;
};

export const ACTIVITY_OVERRIDE_STATUSES = ["ACTIVE", "PROBATION", "INACTIVE"] as const;
export type ActivityOverrideStatus = (typeof ACTIVITY_OVERRIDE_STATUSES)[number];

// ---------------------------------------------------------------------------
// getQuarterBounds
//
// Parses a quarter string like "2025-Q1" and returns the start (inclusive)
// and end (exclusive) Date boundaries for that quarter.
// ---------------------------------------------------------------------------

export function getQuarterBounds(quarter: string): { start: Date; end: Date } {
  const [yearStr, qStr] = quarter.split("-Q");
  const year = parseInt(yearStr, 10);
  const q = parseInt(qStr, 10);

  const quarterStartMonth = (q - 1) * 3; // 0-indexed month: Q1=0, Q2=3, Q3=6, Q4=9
  const start = new Date(year, quarterStartMonth, 1);

  // End is start of the next quarter
  const endMonth = quarterStartMonth + 3;
  const end =
    endMonth >= 12
      ? new Date(year + 1, 0, 1)
      : new Date(year, endMonth, 1);

  return { start, end };
}

// ---------------------------------------------------------------------------
// computeQuarterlyActivity
//
// Aggregates live data from the DB for a given partner/quarter.
// Admin only.
// ---------------------------------------------------------------------------

export async function computeQuarterlyActivity(
  partnerId: string,
  quarter: string,
  deps: ActivityServiceDeps
): Promise<QuarterlyActivityResult> {
  requireAdmin(deps.actor);

  const { start, end } = getQuarterBounds(quarter);

  const [referralsSubmitted, referralsApproved, dealsWon, wonDeals, commissionEvents] =
    await Promise.all([
      deps.db.referral.count({
        where: {
          partnerId,
          submittedAt: { gte: start, lt: end },
        },
      }),
      // Count referrals that were reviewed/approved during this quarter.
      // Uses reviewedAt (when admin acted) rather than submittedAt so that
      // a referral submitted in Q4 and approved in Q1 counts in Q1.
      deps.db.referral.count({
        where: {
          partnerId,
          status: "APPROVED",
          reviewedAt: { gte: start, lt: end },
        },
      }),
      deps.db.deal.count({
        where: {
          partnerId,
          status: "WON",
          closedAt: { gte: start, lt: end },
        },
      }),
      deps.db.deal.findMany({
        where: {
          partnerId,
          status: "WON",
          closedAt: { gte: start, lt: end },
        },
        select: { amountCents: true },
      }),
      deps.db.commissionEvent.findMany({
        where: {
          partnerId,
          kind: { in: ["UPFRONT", "TRAILING"] },
          createdAt: { gte: start, lt: end },
        },
        select: { amountCents: true, kind: true },
      }),
    ]);

  const revenueCents = wonDeals.reduce((sum, d) => sum + d.amountCents, 0);
  const commissionCents = commissionEvents.reduce((sum, e) => sum + e.amountCents, 0);

  return {
    partnerId,
    quarter,
    referralsSubmitted,
    referralsApproved,
    dealsWon,
    revenueCents,
    commissionCents,
  };
}

// ---------------------------------------------------------------------------
// evaluateAgainstTierRequirements
//
// Pure function — no DB calls. Returns compliance status given activity and
// the partner's active commission rules.
// ---------------------------------------------------------------------------

export function evaluateAgainstTierRequirements(
  activity: QuarterlyActivityResult,
  rules: Array<{ id: string; quarterlyMinReferrals: number | null; isActive: boolean }>
): TierComplianceResult {
  const activeRules = rules.filter((r) => r.isActive);
  const rulesWithMin = activeRules.filter((r) => r.quarterlyMinReferrals !== null);

  if (rulesWithMin.length === 0) {
    return {
      meetsRequirements: true,
      minimumReferralsRequired: null,
      referralsApproved: activity.referralsApproved,
    };
  }

  // Use the highest minimum across all active rules
  const minimumReferralsRequired = Math.max(
    ...rulesWithMin.map((r) => r.quarterlyMinReferrals as number)
  );

  const meetsRequirements = activity.referralsApproved >= minimumReferralsRequired;

  return {
    meetsRequirements,
    minimumReferralsRequired,
    referralsApproved: activity.referralsApproved,
  };
}

// ---------------------------------------------------------------------------
// setActivityOverride
//
// Admin only. Upserts the QuarterlyActivitySnapshot with override fields.
// Requires a non-empty reason. Writes an audit log entry.
// ---------------------------------------------------------------------------

export async function setActivityOverride(
  partnerId: string,
  quarter: string,
  overrideStatus: ActivityOverrideStatus,
  overrideReason: string,
  deps: ActivityServiceDeps
): Promise<QuarterlyActivitySnapshotRow> {
  requireAdmin(deps.actor);

  if (!overrideReason || overrideReason.trim() === "") {
    throw new Error("Override requires a non-empty reason.");
  }

  if (!ACTIVITY_OVERRIDE_STATUSES.includes(overrideStatus)) {
    throw new Error(
      `Invalid overrideStatus "${overrideStatus}". Must be one of: ${ACTIVITY_OVERRIDE_STATUSES.join(", ")}.`
    );
  }

  const snapshot = await deps.db.quarterlyActivitySnapshot.upsert({
    where: { partnerId_quarter: { partnerId, quarter } },
    update: { overrideStatus, overrideReason },
    create: {
      partnerId,
      quarter,
      overrideStatus,
      overrideReason,
      referralsSubmitted: 0,
      referralsApproved: 0,
      dealsWon: 0,
      revenueCents: 0,
      commissionCents: 0,
    },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "ACTIVITY_OVERRIDE_SET",
    "QuarterlyActivitySnapshot",
    snapshot.id,
    {
      after: {
        partnerId,
        quarter,
        overrideStatus,
        overrideReason,
      },
    }
  );

  return snapshot;
}

// ---------------------------------------------------------------------------
// getActivitySnapshot
//
// Admin only. Returns the stored snapshot or null.
// ---------------------------------------------------------------------------

export async function getActivitySnapshot(
  partnerId: string,
  quarter: string,
  deps: ActivityServiceDeps
): Promise<QuarterlyActivitySnapshotRow | null> {
  requireAdmin(deps.actor);

  return deps.db.quarterlyActivitySnapshot.findUnique({
    where: { partnerId_quarter: { partnerId, quarter } },
  });
}
