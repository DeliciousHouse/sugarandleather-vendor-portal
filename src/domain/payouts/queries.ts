// ---------------------------------------------------------------------------
// Read models for admin payouts pages
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type AdminPayoutBatchRow = {
  id: string;
  status: string;
  currency: string;
  notes: string | null;
  createdById: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { lines: number };
};

export type AdminPayoutLineRow = {
  id: string;
  payoutBatchId: string;
  commissionEventId: string;
  partnerId: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
};

export type AdminPayoutBatchDetail = AdminPayoutBatchRow & {
  lines: AdminPayoutLineRow[];
};

export type AdminPayableEventRow = {
  id: string;
  partnerId: string;
  dealId: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  tierNameSnapshot: string;
  productCodeSnapshot: string;
  packageCodeSnapshot: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  payoutEligibleAt: Date;
};

type AdminPayoutDb = {
  payoutBatch: {
    findMany: (args: AnyArgs) => Promise<AdminPayoutBatchRow[]>;
    findUnique: (args: AnyArgs) => Promise<AdminPayoutBatchDetail | null>;
  };
  commissionEvent: {
    findMany: (args: AnyArgs) => Promise<AdminPayableEventRow[]>;
  };
};

export async function getAdminPayoutBatches(
  db: AdminPayoutDb,
  opts?: { status?: string; take?: number; skip?: number }
): Promise<AdminPayoutBatchRow[]> {
  const where = opts?.status ? { status: opts.status } : {};
  return db.payoutBatch.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
    skip: opts?.skip ?? 0,
    include: { _count: { select: { lines: true } } },
  });
}

export async function getAdminPayoutBatchById(
  db: AdminPayoutDb,
  id: string
): Promise<AdminPayoutBatchDetail | null> {
  return db.payoutBatch.findUnique({
    where: { id },
    include: {
      lines: {
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { lines: true } },
    },
  });
}

export async function getPayableEvents(
  db: AdminPayoutDb,
  opts?: { currency?: string; take?: number; skip?: number }
): Promise<AdminPayableEventRow[]> {
  const where: Record<string, unknown> = { status: "PAYABLE" };
  if (opts?.currency) where.currency = opts.currency;
  return db.commissionEvent.findMany({
    where,
    orderBy: { payoutEligibleAt: "asc" },
    take: opts?.take ?? 100,
    skip: opts?.skip ?? 0,
    select: {
      id: true,
      partnerId: true,
      dealId: true,
      kind: true,
      status: true,
      amountCents: true,
      currency: true,
      tierNameSnapshot: true,
      productCodeSnapshot: true,
      packageCodeSnapshot: true,
      periodStart: true,
      periodEnd: true,
      payoutEligibleAt: true,
    },
  });
}
