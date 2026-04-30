import { createAuditWriter, type AuditClient, type Actor } from "@/lib/audit";
import { requireAdmin, type SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DealRow = {
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

type ReferralRow = {
  id: string;
  status: string;
  attributionStatus: string;
  partnerId: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type DealDb = AuditClient & {
  referral: {
    findUnique: (args: AnyArgs) => Promise<ReferralRow | null>;
  };
  deal: {
    findUnique: (args: AnyArgs) => Promise<DealRow | null>;
    create: (args: AnyArgs) => Promise<DealRow>;
    update: (args: AnyArgs) => Promise<DealRow>;
  };
};

export type StageCommissionsPort = (input: {
  dealId: string;
  partnerId: string;
  productCode: string;
  packageCode: string | null;
  amountCents: number;
  currency: string;
  closedAt: Date;
}) => Promise<void>;

export type DealServiceDeps = {
  db: DealDb;
  actor: SessionUser;
  stageCommissions: StageCommissionsPort;
};

// ---------------------------------------------------------------------------
// Status workflow maps
// ---------------------------------------------------------------------------

// Referral statuses that block deal creation
const DEAL_BLOCKED_REFERRAL_STATUSES = new Set(["REJECTED", "PENDING_REVIEW"]);

// ---------------------------------------------------------------------------
// createDeal
// ---------------------------------------------------------------------------

export type CreateDealInput = {
  referralId: string;
  productCode: string;
  packageCode?: string | null;
  amountCents: number;
  currency?: string;
  externalCrmId?: string | null;
};

export async function createDeal(
  input: CreateDealInput,
  deps: DealServiceDeps
): Promise<DealRow> {
  requireAdmin(deps.actor);

  const referral = await deps.db.referral.findUnique({
    where: { id: input.referralId },
  });

  if (!referral) {
    throw new Error(`Referral not found: ${input.referralId}`);
  }

  if (DEAL_BLOCKED_REFERRAL_STATUSES.has(referral.status)) {
    throw new Error(
      `Cannot create deal from referral in status ${referral.status}. ` +
        `Only APPROVED referrals are eligible.`
    );
  }

  if (referral.attributionStatus === "DUPLICATE_NO_CREDIT") {
    throw new Error(
      `Cannot create deal from DUPLICATE_NO_CREDIT referral. ` +
        `Only FIRST_ATTRIBUTED referrals are eligible.`
    );
  }

  const existing = await deps.db.deal.findUnique({
    where: { referralId: input.referralId },
  });

  if (existing) {
    throw new Error(
      `A deal already exists for referral ${input.referralId}. ` +
        `Use updateDeal to modify it.`
    );
  }

  const deal = await deps.db.deal.create({
    data: {
      referralId: input.referralId,
      partnerId: referral.partnerId,
      productCode: input.productCode,
      packageCode: input.packageCode ?? null,
      status: "OPEN",
      amountCents: input.amountCents,
      currency: input.currency ?? "USD",
      externalCrmId: input.externalCrmId ?? null,
    },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "DEAL_CREATED",
    "Deal",
    deal.id,
    {
      after: {
        status: "OPEN",
        referralId: input.referralId,
        productCode: input.productCode,
        amountCents: input.amountCents,
      },
    }
  );

  return deal;
}

// ---------------------------------------------------------------------------
// updateDeal
// ---------------------------------------------------------------------------

export type UpdateDealInput = {
  dealId: string;
  status?: "OPEN" | "WON" | "LOST" | "CANCELLED";
  productCode?: string;
  packageCode?: string | null;
  amountCents?: number;
  currency?: string;
  externalCrmId?: string | null;
  lostReason?: string | null;
};

export async function updateDeal(
  input: UpdateDealInput,
  deps: DealServiceDeps
): Promise<DealRow> {
  requireAdmin(deps.actor);

  const deal = await deps.db.deal.findUnique({ where: { id: input.dealId } });
  if (!deal) {
    throw new Error(`Deal not found: ${input.dealId}`);
  }

  const beforeStatus = deal.status;
  const isTransitioningToWon =
    input.status === "WON" && deal.status !== "WON";

  const updateData: Record<string, unknown> = {};
  if (input.status !== undefined) updateData.status = input.status;
  if (input.productCode !== undefined) updateData.productCode = input.productCode;
  if (input.packageCode !== undefined) updateData.packageCode = input.packageCode;
  if (input.amountCents !== undefined) updateData.amountCents = input.amountCents;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.externalCrmId !== undefined) updateData.externalCrmId = input.externalCrmId;
  if (input.lostReason !== undefined) updateData.lostReason = input.lostReason;

  if (isTransitioningToWon) {
    updateData.closedAt = new Date();
  }

  const updated = await deps.db.deal.update({
    where: { id: input.dealId },
    data: updateData,
  });

  // Call commission staging only when transitioning to WON for the first time.
  // Idempotency guard: if deal was already WON before this call, skip staging.
  if (isTransitioningToWon) {
    await deps.stageCommissions({
      dealId: deal.id,
      partnerId: deal.partnerId,
      productCode: input.productCode ?? deal.productCode,
      packageCode:
        input.packageCode !== undefined ? input.packageCode : deal.packageCode,
      amountCents: input.amountCents ?? deal.amountCents,
      currency: input.currency ?? deal.currency,
      closedAt: updateData.closedAt as Date,
    });
  }

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "DEAL_STATUS_UPDATED",
    "Deal",
    deal.id,
    {
      before: { status: beforeStatus },
      after: { status: updated.status },
    }
  );

  return updated;
}

// ---------------------------------------------------------------------------
// Actor adapter for system calls
// ---------------------------------------------------------------------------

export function sessionUserToActor(user: SessionUser): Actor {
  return { type: "USER", id: user.id };
}
