import { createAuditWriter, type AuditClient } from "@/lib/audit";
import { requireAdmin, type SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommissionEventRow = {
  id: string;
  partnerId: string;
  dealId: string;
  ruleId: string | null;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  sourceRevenueCents: number | null;
  percentBpsSnapshot: number | null;
  flatAmountCentsSnapshot: number | null;
  tierNameSnapshot: string;
  productCodeSnapshot: string;
  packageCodeSnapshot: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  payoutEligibleAt: Date;
  paidAt: Date | null;
  clawbackOfEventId: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PayoutBatchRow = {
  id: string;
  status: string;
  currency: string;
  notes: string | null;
  createdById: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PayoutLineRow = {
  id: string;
  payoutBatchId: string;
  commissionEventId: string;
  partnerId: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type PayoutDb = AuditClient & {
  commissionEvent: {
    findMany: (args: AnyArgs) => Promise<CommissionEventRow[]>;
    findUnique: (args: AnyArgs) => Promise<CommissionEventRow | null>;
    update: (args: AnyArgs) => Promise<CommissionEventRow>;
    create: (args: AnyArgs) => Promise<CommissionEventRow>;
    updateMany: (args: AnyArgs) => Promise<{ count: number }>;
  };
  payoutBatch: {
    create: (args: AnyArgs) => Promise<PayoutBatchRow>;
    findUnique: (args: AnyArgs) => Promise<(PayoutBatchRow & { lines?: PayoutLineRow[] }) | null>;
    update: (args: AnyArgs) => Promise<PayoutBatchRow>;
  };
  payoutLine: {
    create: (args: AnyArgs) => Promise<PayoutLineRow>;
    findUnique: (args: AnyArgs) => Promise<PayoutLineRow | null>;
    findMany: (args: AnyArgs) => Promise<PayoutLineRow[]>;
  };
};

export type PayoutServiceDeps = {
  db: PayoutDb;
  actor: SessionUser;
  now?: () => Date;
};

// ---------------------------------------------------------------------------
// promoteToPayable
//
// Moves STAGED commission events with payoutEligibleAt <= now to PAYABLE.
// This is a bulk operation run by an admin before creating payout batches.
// ---------------------------------------------------------------------------

export async function promoteToPayable(
  opts: { currency?: string },
  deps: PayoutServiceDeps
): Promise<{ promoted: number }> {
  requireAdmin(deps.actor);

  const now = deps.now ? deps.now() : new Date();

  const where: Record<string, unknown> = {
    status: "STAGED",
    payoutEligibleAt: { lte: now },
  };
  if (opts.currency) {
    where.currency = opts.currency;
  }

  const result = await deps.db.commissionEvent.updateMany({
    where,
    data: { status: "PAYABLE" },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "COMMISSIONS_PROMOTED_PAYABLE",
    "CommissionEvent",
    "batch",
    { after: { promoted: result.count, promotedAt: now } }
  );

  return { promoted: result.count };
}

// ---------------------------------------------------------------------------
// createPayoutBatch
//
// Creates a DRAFT payout batch and PayoutLines for the given PAYABLE events.
// Double-pay guard: PayoutLine.commissionEventId is @unique, and we check
// before creating.
// ---------------------------------------------------------------------------

export type CreatePayoutBatchInput = {
  eventIds: string[];
  currency?: string;
  notes?: string | null;
};

export async function createPayoutBatch(
  input: CreatePayoutBatchInput,
  deps: PayoutServiceDeps
): Promise<PayoutBatchRow> {
  requireAdmin(deps.actor);

  const events = await deps.db.commissionEvent.findMany({
    where: { id: { in: input.eventIds } },
  });

  if (events.length !== input.eventIds.length) {
    const found = new Set(events.map((e) => e.id));
    const missing = input.eventIds.filter((id) => !found.has(id));
    throw new Error(`Commission events not found: ${missing.join(", ")}`);
  }

  for (const event of events) {
    if (event.status !== "PAYABLE") {
      throw new Error(
        `Commission event ${event.id} is in status ${event.status}, expected PAYABLE.`
      );
    }
  }

  // Double-pay guard: check for existing PayoutLines before creating the batch
  for (const eventId of input.eventIds) {
    const existingLine = await deps.db.payoutLine.findUnique({
      where: { commissionEventId: eventId },
    });
    if (existingLine) {
      throw new Error(
        `Commission event ${eventId} is already included in payout batch ${existingLine.payoutBatchId}.`
      );
    }
  }

  const batch = await deps.db.payoutBatch.create({
    data: {
      status: "DRAFT",
      currency: input.currency ?? "USD",
      notes: input.notes ?? null,
      createdById: deps.actor.id,
    },
  });

  for (const event of events) {
    await deps.db.payoutLine.create({
      data: {
        payoutBatchId: batch.id,
        commissionEventId: event.id,
        partnerId: event.partnerId,
        amountCents: event.amountCents,
        currency: event.currency,
      },
    });
  }

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "PAYOUT_BATCH_CREATED",
    "PayoutBatch",
    batch.id,
    { after: { eventCount: events.length, currency: batch.currency } }
  );

  return batch;
}

// ---------------------------------------------------------------------------
// markBatchPaid
//
// Marks the batch PAID and all its commission events PAID.
// Idempotent if already PAID. Throws if VOIDED.
// ---------------------------------------------------------------------------

export async function markBatchPaid(
  batchId: string,
  deps: PayoutServiceDeps
): Promise<PayoutBatchRow> {
  requireAdmin(deps.actor);

  const batch = await deps.db.payoutBatch.findUnique({
    where: { id: batchId },
    include: { lines: true },
  });
  if (!batch) {
    throw new Error(`Payout batch not found: ${batchId}`);
  }

  if (batch.status === "PAID") {
    return batch;
  }

  if (batch.status === "VOIDED") {
    throw new Error(`Cannot mark a VOIDED payout batch as paid.`);
  }

  const lines = batch.lines ?? [];
  const paidAt = deps.now ? deps.now() : new Date();

  for (const line of lines) {
    await deps.db.commissionEvent.update({
      where: { id: line.commissionEventId },
      data: { status: "PAID", paidAt },
    });
  }

  const updated = await deps.db.payoutBatch.update({
    where: { id: batchId },
    data: { status: "PAID", paidAt },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "PAYOUT_BATCH_PAID",
    "PayoutBatch",
    batchId,
    {
      before: { status: batch.status },
      after: { status: "PAID", paidAt, lineCount: lines.length },
    }
  );

  return updated;
}

// ---------------------------------------------------------------------------
// clawbackEvent
//
// Creates a negative CommissionEvent linked to the original via
// clawbackOfEventId. Never deletes paid history — additive only.
// Prevents duplicate clawback for the same event (clawbackOfEventId @unique).
// ---------------------------------------------------------------------------

export type ClawbackInput = {
  eventId: string;
  reason: string;
};

export async function clawbackEvent(
  input: ClawbackInput,
  deps: PayoutServiceDeps
): Promise<CommissionEventRow> {
  requireAdmin(deps.actor);

  if (!input.reason || input.reason.trim() === "") {
    throw new Error("Clawback requires a reason.");
  }

  const original = await deps.db.commissionEvent.findUnique({
    where: { id: input.eventId },
  });
  if (!original) {
    throw new Error(`Commission event not found: ${input.eventId}`);
  }

  const existingClawback = await deps.db.commissionEvent.findUnique({
    where: { clawbackOfEventId: input.eventId },
  });
  if (existingClawback) {
    throw new Error(
      `A clawback already exists for commission event ${input.eventId} ` +
        `(clawback id: ${existingClawback.id}). ` +
        `To make a separate adjustment, create a new ADJUSTMENT event.`
    );
  }

  const clawback = await deps.db.commissionEvent.create({
    data: {
      partnerId: original.partnerId,
      dealId: original.dealId,
      ruleId: original.ruleId,
      kind: "CLAWBACK",
      status: "CLAWED_BACK",
      amountCents: -Math.abs(original.amountCents),
      currency: original.currency,
      sourceRevenueCents: original.sourceRevenueCents,
      percentBpsSnapshot: original.percentBpsSnapshot,
      flatAmountCentsSnapshot: original.flatAmountCentsSnapshot,
      tierNameSnapshot: original.tierNameSnapshot,
      productCodeSnapshot: original.productCodeSnapshot,
      packageCodeSnapshot: original.packageCodeSnapshot,
      periodStart: original.periodStart,
      periodEnd: original.periodEnd,
      payoutEligibleAt: deps.now ? deps.now() : new Date(),
      clawbackOfEventId: input.eventId,
      reason: input.reason,
    },
  });

  // Mark original event as CLAWED_BACK without deleting it
  await deps.db.commissionEvent.update({
    where: { id: input.eventId },
    data: { status: "CLAWED_BACK" },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "COMMISSION_CLAWBACK",
    "CommissionEvent",
    clawback.id,
    {
      after: {
        clawbackOfEventId: input.eventId,
        amountCents: clawback.amountCents,
        reason: input.reason,
      },
    }
  );

  return clawback;
}
