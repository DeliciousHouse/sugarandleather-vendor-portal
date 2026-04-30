import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/access-control";
import {
  computeQuarterlyActivity,
  evaluateAgainstTierRequirements,
  getActivitySnapshot,
  type ActivityDb,
} from "@/domain/activity/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type PartnerWithRulesRow = {
  id: string;
  tierId: string;
  tier: {
    id: string;
    name: string;
    rules: Array<{
      id: string;
      quarterlyMinReferrals: number | null;
      isActive: boolean;
    }>;
  };
};

type ActivityQueryDb = {
  partner: {
    findUnique: (args: AnyArgs) => Promise<PartnerWithRulesRow | null>;
  };
};

export async function getPartnerWithRules(
  db: ActivityQueryDb,
  partnerId: string
): Promise<PartnerWithRulesRow | null> {
  return db.partner.findUnique({
    where: { id: partnerId },
    include: {
      tier: {
        include: {
          rules: {
            where: { isActive: true },
            select: { id: true, quarterlyMinReferrals: true, isActive: true },
          },
        },
      },
    },
  });
}


export async function getPartnerQuarterlyActivityDashboard(
  partnerId: string,
  quarters: string[],
  actor: SessionUser
): Promise<{
  partner: PartnerWithRulesRow | null;
  quarterData: Array<{
    quarter: string;
    activity: Awaited<ReturnType<typeof computeQuarterlyActivity>>;
    tierCompliance: ReturnType<typeof evaluateAgainstTierRequirements>;
    snapshot: Awaited<ReturnType<typeof getActivitySnapshot>>;
  }>;
}> {
  const db = prisma as unknown as ActivityDb;
  const partner = await getPartnerWithRules(db as unknown as ActivityQueryDb, partnerId);

  if (!partner) {
    return { partner: null, quarterData: [] };
  }

  const rules = partner.tier?.rules ?? [];
  const deps = { db, actor };
  const quarterData = await Promise.all(
    quarters.map(async (quarter) => {
      const [activity, snapshot] = await Promise.all([
        computeQuarterlyActivity(partnerId, quarter, deps),
        getActivitySnapshot(partnerId, quarter, deps),
      ]);
      const tierCompliance = evaluateAgainstTierRequirements(activity, rules);
      return { quarter, activity, tierCompliance, snapshot };
    })
  );

  return { partner, quarterData };
}
