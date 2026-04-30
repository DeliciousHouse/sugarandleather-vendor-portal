// ---------------------------------------------------------------------------
// Read models for admin tiers pages
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type AdminTierRow = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminCommissionRuleRow = {
  id: string;
  tierId: string;
  productCode: string;
  packageCode: string | null;
  kind: string;
  percentBps: number | null;
  flatAmountCents: number | null;
  currency: string;
  trailingMonths: number | null;
  payoutDelayDays: number;
  clawbackWindowDays: number;
  quarterlyMinReferrals: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminTierDetail = AdminTierRow & {
  rules: AdminCommissionRuleRow[];
  _count: { partners: number };
};

type AdminTierDb = {
  tier: {
    findMany: (args: AnyArgs) => Promise<AdminTierRow[]>;
    findUnique: (args: AnyArgs) => Promise<AdminTierDetail | null>;
  };
};

export async function getAdminTiers(
  db: AdminTierDb,
  opts?: { includeInactive?: boolean; take?: number; skip?: number }
): Promise<AdminTierRow[]> {
  const where = opts?.includeInactive ? {} : { isActive: true };
  return db.tier.findMany({
    where,
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
  });
}

export async function getAdminTierById(
  db: AdminTierDb,
  id: string
): Promise<AdminTierDetail | null> {
  return db.tier.findUnique({
    where: { id },
    include: {
      rules: {
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { partners: true } },
    },
  });
}
