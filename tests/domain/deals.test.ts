import { describe, it, expect, vi } from "vitest";
import type { SessionUser } from "@/lib/access-control";
import {
  createDeal,
  updateDeal,
  type CreateDealInput,
  type DealDb,
} from "@/domain/deals/service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type FakeReferral = {
  id: string;
  status: string;
  attributionStatus: string;
  partnerId: string;
};

type FakeDeal = {
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

function makeReferral(overrides?: Partial<FakeReferral>): FakeReferral {
  return {
    id: "ref_1",
    status: "APPROVED",
    attributionStatus: "FIRST_ATTRIBUTED",
    partnerId: "partner_1",
    ...overrides,
  };
}

function makeDeal(overrides?: Partial<FakeDeal>): FakeDeal {
  return {
    id: "deal_1",
    referralId: "ref_1",
    partnerId: "partner_1",
    productCode: "ARIES_AI",
    packageCode: null,
    status: "OPEN",
    amountCents: 500000,
    currency: "USD",
    externalCrmId: null,
    closedAt: null,
    lostReason: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    ...overrides,
  };
}

function makeDb(opts: {
  referral: FakeReferral | null;
  existingDeal?: FakeDeal | null;
  dealById?: FakeDeal | null;
}): DealDb {
  return {
    referral: {
      findUnique: vi.fn(async () =>
        opts.referral ? { ...opts.referral } : null
      ),
    },
    deal: {
      findUnique: vi.fn(
        async (args: { where: { id?: string; referralId?: string } }) => {
          if ("referralId" in args.where) {
            return opts.existingDeal ? { ...opts.existingDeal } : null;
          }
          return opts.dealById ? { ...opts.dealById } : null;
        }
      ),
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: "deal_new",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: vi.fn(
        async ({ data }: { where: { id: string }; data: object }) => ({
          ...(opts.dealById ?? makeDeal()),
          ...data,
          updatedAt: new Date(),
        })
      ),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  } as unknown as DealDb;
}

const adminActor: SessionUser = {
  id: "admin_1",
  role: "ADMIN",
  status: "ACTIVE",
};

const partnerActor: SessionUser = {
  id: "partner_user_1",
  role: "PARTNER",
  status: "ACTIVE",
};

// ---------------------------------------------------------------------------
// createDeal — guard conditions
// ---------------------------------------------------------------------------

describe("createDeal — guard conditions", () => {
  const validInput: CreateDealInput = {
    referralId: "ref_1",
    productCode: "ARIES_AI",
    packageCode: null,
    amountCents: 500000,
    currency: "USD",
  };

  it("throws if referral is not found", async () => {
    const db = makeDb({ referral: null });
    await expect(
      createDeal(validInput, { db, actor: adminActor, stageCommissions: vi.fn() })
    ).rejects.toThrow(/not found/i);
  });

  it("throws if referral status is REJECTED", async () => {
    const db = makeDb({ referral: makeReferral({ status: "REJECTED" }) });
    await expect(
      createDeal(validInput, { db, actor: adminActor, stageCommissions: vi.fn() })
    ).rejects.toThrow(/REJECTED/);
  });

  it("throws if referral status is PENDING_REVIEW", async () => {
    const db = makeDb({ referral: makeReferral({ status: "PENDING_REVIEW" }) });
    await expect(
      createDeal(validInput, { db, actor: adminActor, stageCommissions: vi.fn() })
    ).rejects.toThrow(/PENDING_REVIEW/);
  });

  it("throws if referral attributionStatus is DUPLICATE_NO_CREDIT", async () => {
    const db = makeDb({
      referral: makeReferral({ attributionStatus: "DUPLICATE_NO_CREDIT" }),
    });
    await expect(
      createDeal(validInput, { db, actor: adminActor, stageCommissions: vi.fn() })
    ).rejects.toThrow(/DUPLICATE_NO_CREDIT/);
  });

  it("throws if a deal already exists for this referral", async () => {
    const db = makeDb({
      referral: makeReferral(),
      existingDeal: makeDeal(),
    });
    await expect(
      createDeal(validInput, { db, actor: adminActor, stageCommissions: vi.fn() })
    ).rejects.toThrow(/already exists/i);
  });

  it("throws if actor is not admin", async () => {
    const db = makeDb({ referral: makeReferral() });
    await expect(
      createDeal(validInput, {
        db,
        actor: partnerActor,
        stageCommissions: vi.fn(),
      })
    ).rejects.toThrow(/admin/i);
  });
});

// ---------------------------------------------------------------------------
// createDeal — happy path
// ---------------------------------------------------------------------------

describe("createDeal — happy path", () => {
  const validInput: CreateDealInput = {
    referralId: "ref_1",
    productCode: "ARIES_AI",
    packageCode: null,
    amountCents: 500000,
    currency: "USD",
  };

  it("creates a deal with OPEN status for APPROVED + FIRST_ATTRIBUTED referral", async () => {
    const db = makeDb({ referral: makeReferral() });
    const result = await createDeal(validInput, {
      db,
      actor: adminActor,
      stageCommissions: vi.fn(),
    });
    expect(result.status).toBe("OPEN");
  });

  it("persists the partnerId from the referral", async () => {
    const db = makeDb({ referral: makeReferral({ partnerId: "partner_42" }) });
    const result = await createDeal(validInput, {
      db,
      actor: adminActor,
      stageCommissions: vi.fn(),
    });
    expect(result.partnerId).toBe("partner_42");
  });

  it("writes a DEAL_CREATED audit log entry", async () => {
    const db = makeDb({ referral: makeReferral() });
    await createDeal(validInput, {
      db,
      actor: adminActor,
      stageCommissions: vi.fn(),
    });
    expect(db.auditLog.create).toHaveBeenCalledOnce();
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("DEAL_CREATED");
  });
});

// ---------------------------------------------------------------------------
// updateDeal — status transitions
// ---------------------------------------------------------------------------

describe("updateDeal — status transitions", () => {
  it("transitions a deal from OPEN to WON", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const stageCommissions = vi.fn().mockResolvedValue([]);
    const result = await updateDeal(
      { dealId: "deal_1", status: "WON" },
      { db, actor: adminActor, stageCommissions }
    );
    expect(result.status).toBe("WON");
  });

  it("transitions a deal from OPEN to LOST", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const result = await updateDeal(
      { dealId: "deal_1", status: "LOST", lostReason: "Budget" },
      { db, actor: adminActor, stageCommissions: vi.fn() }
    );
    expect(result.status).toBe("LOST");
  });

  it("transitions a deal from OPEN to CANCELLED", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const result = await updateDeal(
      { dealId: "deal_1", status: "CANCELLED" },
      { db, actor: adminActor, stageCommissions: vi.fn() }
    );
    expect(result.status).toBe("CANCELLED");
  });

  it("throws if deal is not found", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: null });
    await expect(
      updateDeal(
        { dealId: "nonexistent", status: "WON" },
        { db, actor: adminActor, stageCommissions: vi.fn() }
      )
    ).rejects.toThrow(/not found/i);
  });

  it("throws if actor is not admin", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    await expect(
      updateDeal(
        { dealId: "deal_1", status: "WON" },
        { db, actor: partnerActor, stageCommissions: vi.fn() }
      )
    ).rejects.toThrow(/admin/i);
  });
});

// ---------------------------------------------------------------------------
// updateDeal — WON commission staging
// ---------------------------------------------------------------------------

describe("updateDeal — WON commission staging", () => {
  it("calls stageCommissions when transitioning to WON", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const stageCommissions = vi.fn().mockResolvedValue([]);
    await updateDeal(
      { dealId: "deal_1", status: "WON" },
      { db, actor: adminActor, stageCommissions }
    );
    expect(stageCommissions).toHaveBeenCalledOnce();
  });

  it("does NOT call stageCommissions if deal is already WON (idempotency)", async () => {
    const db = makeDb({
      referral: makeReferral(),
      dealById: makeDeal({ status: "WON" }),
    });
    const stageCommissions = vi.fn();
    await updateDeal(
      { dealId: "deal_1", status: "WON" },
      { db, actor: adminActor, stageCommissions }
    );
    expect(stageCommissions).not.toHaveBeenCalled();
  });

  it("passes correct deal context to stageCommissions", async () => {
    const deal = makeDeal({
      partnerId: "partner_99",
      productCode: "ARIES_AI",
      packageCode: "PRO",
      amountCents: 750000,
      currency: "USD",
    });
    const db = makeDb({ referral: makeReferral(), dealById: deal });
    const stageCommissions = vi.fn().mockResolvedValue([]);
    await updateDeal(
      { dealId: "deal_1", status: "WON" },
      { db, actor: adminActor, stageCommissions }
    );
    const arg = stageCommissions.mock.calls[0][0];
    expect(arg.partnerId).toBe("partner_99");
    expect(arg.amountCents).toBe(750000);
    expect(arg.productCode).toBe("ARIES_AI");
    expect(arg.packageCode).toBe("PRO");
  });

  it("does not call stageCommissions when transitioning to LOST", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const stageCommissions = vi.fn();
    await updateDeal(
      { dealId: "deal_1", status: "LOST", lostReason: "No budget" },
      { db, actor: adminActor, stageCommissions }
    );
    expect(stageCommissions).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// updateDeal — audit log
// ---------------------------------------------------------------------------

describe("updateDeal — audit log", () => {
  it("writes a DEAL_STATUS_UPDATED audit log entry", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const stageCommissions = vi.fn().mockResolvedValue([]);
    await updateDeal(
      { dealId: "deal_1", status: "WON" },
      { db, actor: adminActor, stageCommissions }
    );
    expect(db.auditLog.create).toHaveBeenCalled();
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.action).toBe("DEAL_STATUS_UPDATED");
  });

  it("includes before/after status in audit log", async () => {
    const db = makeDb({ referral: makeReferral(), dealById: makeDeal() });
    const stageCommissions = vi.fn().mockResolvedValue([]);
    await updateDeal(
      { dealId: "deal_1", status: "WON" },
      { db, actor: adminActor, stageCommissions }
    );
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0];
    expect(call.data.before).toMatchObject({ status: "OPEN" });
    expect(call.data.after).toMatchObject({ status: "WON" });
  });
});
