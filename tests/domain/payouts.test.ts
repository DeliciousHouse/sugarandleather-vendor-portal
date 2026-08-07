import { describe, it, expect, vi } from "vitest";
import {
  promoteToPayable,
  createPayoutBatch,
  markBatchPaid,
  clawbackEvent,
  type PayoutDb,
  type CommissionEventRow,
  type PayoutBatchRow,
  type PayoutLineRow,
} from "@/domain/payouts/service";
import type { SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const adminUser: SessionUser = { id: "admin_1", role: "ADMIN", status: "ACTIVE" };
const partnerUser: SessionUser = { id: "partner_1", role: "PARTNER", status: "ACTIVE" };

const now = new Date("2025-03-01T00:00:00Z");
const past = new Date("2025-02-01T00:00:00Z");

function makeEvent(overrides?: Partial<CommissionEventRow>): CommissionEventRow {
  return {
    id: "event_1",
    partnerId: "partner_1",
    dealId: "deal_1",
    ruleId: "rule_1",
    kind: "UPFRONT",
    status: "STAGED",
    amountCents: 10000,
    currency: "USD",
    sourceRevenueCents: 100000,
    percentBpsSnapshot: 1000,
    flatAmountCentsSnapshot: null,
    tierNameSnapshot: "Affiliate",
    productCodeSnapshot: "ARIES_AI",
    packageCodeSnapshot: null,
    periodStart: null,
    periodEnd: null,
    payoutEligibleAt: past,
    paidAt: null,
    clawbackOfEventId: null,
    reason: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    ...overrides,
  };
}

type PayoutBatchWithLines = PayoutBatchRow & { lines?: PayoutLineRow[] };

function makeBatch(overrides?: Partial<PayoutBatchWithLines>): PayoutBatchWithLines {
  return {
    id: "batch_1",
    status: "DRAFT",
    currency: "USD",
    notes: null,
    createdById: "admin_1",
    paidAt: null,
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-03-01"),
    ...overrides,
  };
}

function makeLine(overrides?: Partial<PayoutLineRow>): PayoutLineRow {
  return {
    id: "line_1",
    payoutBatchId: "batch_1",
    commissionEventId: "event_1",
    partnerId: "partner_1",
    amountCents: 10000,
    currency: "USD",
    createdAt: new Date("2025-03-01"),
    ...overrides,
  };
}

type FakeDb = {
  events?: CommissionEventRow[];
  eventById?: Record<string, CommissionEventRow | null>;
  clawbackCheck?: CommissionEventRow | null;
  batch?: PayoutBatchRow & { lines?: PayoutLineRow[] };
  existingLine?: PayoutLineRow | null;
  lineByEventId?: Record<string, PayoutLineRow | null>;
  updateManyCount?: number;
};

function makeDb(opts: FakeDb = {}): PayoutDb {
  const updatedEvents: Record<string, Partial<CommissionEventRow>> = {};

  return {
    commissionEvent: {
      findMany: vi.fn(async () => opts.events ?? []),
      findUnique: vi.fn(
        async (args: { where: { id?: string; clawbackOfEventId?: string } }) => {
          if (args.where.id) {
            if (opts.eventById) return opts.eventById[args.where.id] ?? null;
            return opts.events?.find((e) => e.id === args.where.id) ?? null;
          }
          if (args.where.clawbackOfEventId !== undefined) {
            return opts.clawbackCheck ?? null;
          }
          return null;
        }
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: object }) => {
        const base =
          opts.eventById?.[where.id] ??
          opts.events?.find((e) => e.id === where.id) ??
          makeEvent({ id: where.id });
        updatedEvents[where.id] = { ...base, ...data };
        return { ...base, ...data } as CommissionEventRow;
      }),
      create: vi.fn(async ({ data }: { data: object }) =>
        makeEvent({
          ...(data as Partial<CommissionEventRow>),
          id: `event_clawback_${Math.random().toString(36).slice(2)}`,
          createdAt: now,
          updatedAt: now,
        })
      ),
      updateMany: vi.fn(async () => ({ count: opts.updateManyCount ?? 0 })),
    },
    payoutBatch: {
      create: vi.fn(async ({ data }: { data: object }) =>
        makeBatch({
          ...(data as Partial<PayoutBatchRow>),
          id: "batch_new",
          createdAt: now,
          updatedAt: now,
        })
      ),
      findUnique: vi.fn(async () =>
        opts.batch !== undefined ? opts.batch : null
      ),
      update: vi.fn(async ({ data }: { data: object }) =>
        makeBatch({
          ...(opts.batch ?? makeBatch()),
          ...(data as Partial<PayoutBatchRow>),
          updatedAt: now,
        })
      ),
    },
    payoutLine: {
      create: vi.fn(async ({ data }: { data: object }) =>
        makeLine({
          ...(data as Partial<PayoutLineRow>),
          id: `line_${Math.random().toString(36).slice(2)}`,
          createdAt: now,
        })
      ),
      findUnique: vi.fn(async (args: { where: { commissionEventId?: string } }) => {
        if (opts.lineByEventId && args.where.commissionEventId) {
          return opts.lineByEventId[args.where.commissionEventId] ?? null;
        }
        return opts.existingLine !== undefined ? opts.existingLine : null;
      }),
      findMany: vi.fn(async () => []),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  };
}

// ---------------------------------------------------------------------------
// promoteToPayable
// ---------------------------------------------------------------------------

describe("promoteToPayable", () => {
  it("calls updateMany with STAGED status and payoutEligibleAt lte now", async () => {
    const db = makeDb({ updateManyCount: 3 });
    const result = await promoteToPayable({}, { db, actor: adminUser, now: () => now });

    expect(db.commissionEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "STAGED",
          payoutEligibleAt: expect.objectContaining({ lte: now }),
        }),
        data: { status: "PAYABLE" },
      })
    );
    expect(result.promoted).toBe(3);
  });

  it("returns promoted count of zero when no events are eligible", async () => {
    const db = makeDb({ updateManyCount: 0 });
    const result = await promoteToPayable({}, { db, actor: adminUser, now: () => now });
    expect(result.promoted).toBe(0);
  });

  it("writes an audit log entry", async () => {
    const db = makeDb({ updateManyCount: 1 });
    await promoteToPayable({}, { db, actor: adminUser, now: () => now });
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "COMMISSIONS_PROMOTED_PAYABLE" }),
      })
    );
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({});
    await expect(
      promoteToPayable({}, { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// createPayoutBatch
// ---------------------------------------------------------------------------

describe("createPayoutBatch", () => {
  it("creates a payout batch and PayoutLines for PAYABLE events", async () => {
    const events = [
      makeEvent({ id: "event_1", status: "PAYABLE" }),
      makeEvent({ id: "event_2", status: "PAYABLE", amountCents: 5000 }),
    ];
    const db = makeDb({ events, existingLine: null });

    const result = await createPayoutBatch(
      { eventIds: ["event_1", "event_2"] },
      { db, actor: adminUser }
    );

    expect(db.payoutBatch.create).toHaveBeenCalled();
    expect(db.payoutLine.create).toHaveBeenCalledTimes(2);
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PAYOUT_BATCH_CREATED" }),
      })
    );
    expect(result).toBeDefined();
  });

  it("throws when an event is not PAYABLE", async () => {
    const events = [makeEvent({ id: "event_1", status: "STAGED" })];
    const db = makeDb({ events, existingLine: null });

    await expect(
      createPayoutBatch({ eventIds: ["event_1"] }, { db, actor: adminUser })
    ).rejects.toThrow(/STAGED/);
  });

  it("throws when an event is already PAID", async () => {
    const events = [makeEvent({ id: "event_1", status: "PAID" })];
    const db = makeDb({ events, existingLine: null });

    await expect(
      createPayoutBatch({ eventIds: ["event_1"] }, { db, actor: adminUser })
    ).rejects.toThrow(/PAID/);
  });

  it("throws double-pay guard when event already has a PayoutLine", async () => {
    const events = [makeEvent({ id: "event_1", status: "PAYABLE" })];
    const existingLine = makeLine({ commissionEventId: "event_1", payoutBatchId: "batch_old" });
    const db = makeDb({ events, existingLine });

    await expect(
      createPayoutBatch({ eventIds: ["event_1"] }, { db, actor: adminUser })
    ).rejects.toThrow(/already included/);
  });

  it("throws when event IDs are not found", async () => {
    const db = makeDb({ events: [] });

    await expect(
      createPayoutBatch({ eventIds: ["event_missing"] }, { db, actor: adminUser })
    ).rejects.toThrow(/not found/);
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({});
    await expect(
      createPayoutBatch({ eventIds: [] }, { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// markBatchPaid
// ---------------------------------------------------------------------------

describe("markBatchPaid", () => {
  it("marks the batch PAID and all commission events PAID", async () => {
    const lines = [
      makeLine({ commissionEventId: "event_1" }),
      makeLine({ id: "line_2", commissionEventId: "event_2" }),
    ];
    const batch = makeBatch({ status: "DRAFT", lines });
    const db = makeDb({ batch });

    await markBatchPaid("batch_1", { db, actor: adminUser, now: () => now });

    expect(db.payoutBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID", paidAt: now }),
      })
    );
    expect(db.commissionEvent.update).toHaveBeenCalledTimes(2);
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PAYOUT_BATCH_PAID" }),
      })
    );
  });

  it("is idempotent when batch is already PAID", async () => {
    const batch = makeBatch({ status: "PAID", paidAt: past });
    const db = makeDb({ batch });

    const result = await markBatchPaid("batch_1", { db, actor: adminUser });

    expect(db.payoutBatch.update).not.toHaveBeenCalled();
    expect(result.status).toBe("PAID");
  });

  it("throws when batch is VOIDED", async () => {
    const batch = makeBatch({ status: "VOIDED" });
    const db = makeDb({ batch });

    await expect(
      markBatchPaid("batch_1", { db, actor: adminUser })
    ).rejects.toThrow(/VOIDED/);
  });

  it("throws when batch not found", async () => {
    const db = makeDb({ batch: undefined });

    await expect(
      markBatchPaid("batch_missing", { db, actor: adminUser })
    ).rejects.toThrow("Payout batch not found");
  });

  it("throws Forbidden for non-admin", async () => {
    const batch = makeBatch();
    const db = makeDb({ batch });
    await expect(
      markBatchPaid("batch_1", { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// clawbackEvent
// ---------------------------------------------------------------------------

describe("clawbackEvent", () => {
  it("creates a negative commission event and marks original CLAWED_BACK", async () => {
    const original = makeEvent({ id: "event_1", status: "PAID", amountCents: 10000 });
    const db = makeDb({
      eventById: { event_1: original },
      clawbackCheck: null,
    });

    const result = await clawbackEvent(
      { eventId: "event_1", reason: "Customer refund" },
      { db, actor: adminUser, now: () => now }
    );

    // Created negative amount
    expect(db.commissionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: "CLAWBACK",
          status: "CLAWED_BACK",
          amountCents: -10000,
          clawbackOfEventId: "event_1",
          reason: "Customer refund",
        }),
      })
    );
    // Original event marked CLAWED_BACK
    expect(db.commissionEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "event_1" },
        data: { status: "CLAWED_BACK" },
      })
    );
    // Audit log written
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "COMMISSION_CLAWBACK" }),
      })
    );
    expect(result.amountCents).toBe(-10000);
  });

  it("requires a reason and throws if reason is empty", async () => {
    const db = makeDb({ eventById: { event_1: makeEvent({ id: "event_1" }) } });

    await expect(
      clawbackEvent({ eventId: "event_1", reason: "" }, { db, actor: adminUser })
    ).rejects.toThrow(/reason/);
  });

  it("requires a reason and throws if reason is whitespace only", async () => {
    const db = makeDb({ eventById: { event_1: makeEvent({ id: "event_1" }) } });

    await expect(
      clawbackEvent({ eventId: "event_1", reason: "   " }, { db, actor: adminUser })
    ).rejects.toThrow(/reason/);
  });

  it("prevents duplicate clawback for the same event", async () => {
    const original = makeEvent({ id: "event_1", status: "PAID" });
    const existingClawback = makeEvent({
      id: "event_clawback_1",
      kind: "CLAWBACK",
      clawbackOfEventId: "event_1",
    });
    const db = makeDb({
      eventById: { event_1: original },
      clawbackCheck: existingClawback,
    });

    await expect(
      clawbackEvent({ eventId: "event_1", reason: "Duplicate attempt" }, { db, actor: adminUser })
    ).rejects.toThrow(/clawback already exists/i);
  });

  it("throws when original event not found", async () => {
    const db = makeDb({ eventById: { event_1: null } });

    await expect(
      clawbackEvent({ eventId: "event_1", reason: "Test" }, { db, actor: adminUser })
    ).rejects.toThrow("Commission event not found");
  });

  it("preserves snapshots from the original event in the clawback", async () => {
    const original = makeEvent({
      id: "event_1",
      status: "PAID",
      tierNameSnapshot: "Authorized Reseller",
      productCodeSnapshot: "ARIES_AI",
      percentBpsSnapshot: 2000,
    });
    const db = makeDb({
      eventById: { event_1: original },
      clawbackCheck: null,
    });

    await clawbackEvent({ eventId: "event_1", reason: "Refund" }, { db, actor: adminUser, now: () => now });

    expect(db.commissionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tierNameSnapshot: "Authorized Reseller",
          productCodeSnapshot: "ARIES_AI",
          percentBpsSnapshot: 2000,
        }),
      })
    );
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({});
    await expect(
      clawbackEvent({ eventId: "event_1", reason: "Test" }, { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});
