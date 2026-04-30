// ---------------------------------------------------------------------------
// Read models for admin deals pages
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type AdminDealRow = {
  id: string;
  referralId: string;
  partnerId: string;
  productCode: string;
  packageCode: string | null;
  status: string;
  amountCents: number;
  currency: string;
  externalCrmId: string | null;
  closedAt: Date | null;
  lostReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommissionEventSummary = {
  id: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  tierNameSnapshot: string;
  percentBpsSnapshot: number | null;
  flatAmountCentsSnapshot: number | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  payoutEligibleAt: Date;
};

export type AdminDealDetail = AdminDealRow & {
  commissionEvents: CommissionEventSummary[];
};

type AdminDealDb = {
  deal: {
    findMany: (args: AnyArgs) => Promise<AdminDealRow[]>;
    findUnique: (args: AnyArgs) => Promise<AdminDealRow | null>;
  };
  commissionEvent: {
    findMany: (args: AnyArgs) => Promise<CommissionEventSummary[]>;
  };
};

export async function getAdminDeals(
  db: AdminDealDb,
  opts?: { status?: string; take?: number; skip?: number }
): Promise<AdminDealRow[]> {
  const where = opts?.status ? { status: opts.status } : {};
  return db.deal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
  });
}

export async function getAdminDealById(
  db: AdminDealDb,
  id: string
): Promise<AdminDealDetail | null> {
  const deal = await db.deal.findUnique({
    where: { id },
  });
  if (!deal) return null;

  const commissionEvents = await db.commissionEvent.findMany({
    where: { dealId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      kind: true,
      status: true,
      amountCents: true,
      currency: true,
      tierNameSnapshot: true,
      percentBpsSnapshot: true,
      flatAmountCentsSnapshot: true,
      periodStart: true,
      periodEnd: true,
      payoutEligibleAt: true,
    },
  });

  return { ...deal, commissionEvents };
}
