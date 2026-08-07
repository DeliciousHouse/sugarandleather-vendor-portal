import { describe, it, expect, vi } from "vitest";
import {
  calculateUpfrontAmount,
  buildTrailingPeriods,
  type CommissionRuleSnapshot,
} from "@/domain/commissions/rules";
import {
  stageCommissions,
  type StageCommissionsInput,
  type CommissionDb,
  type CommissionEventRow,
} from "@/domain/commissions/service";

// ---------------------------------------------------------------------------
// Rule fixtures
// ---------------------------------------------------------------------------

const percentRule: CommissionRuleSnapshot = {
  id: "rule_1",
  tierId: "tier_1",
  tierName: "Affiliate",
  productCode: "ARIES_AI",
  packageCode: null,
  kind: "UPFRONT",
  percentBps: 1000, // 10%
  flatAmountCents: null,
  currency: "USD",
  trailingMonths: null,
  payoutDelayDays: 30,
};

const flatRule: CommissionRuleSnapshot = {
  id: "rule_2",
  tierId: "tier_1",
  tierName: "Affiliate",
  productCode: "ARIES_AI",
  packageCode: null,
  kind: "UPFRONT",
  percentBps: null,
  flatAmountCents: 50000, // $500 flat
  currency: "USD",
  trailingMonths: null,
  payoutDelayDays: 30,
};

const trailingRule: CommissionRuleSnapshot = {
  id: "rule_3",
  tierId: "tier_1",
  tierName: "Affiliate",
  productCode: "ARIES_AI",
  packageCode: null,
  kind: "TRAILING",
  percentBps: 500, // 5%
  flatAmountCents: null,
  currency: "USD",
  trailingMonths: 3,
  payoutDelayDays: 30,
};

function makeCommissionDb(): CommissionDb {
  return {
    commissionEvent: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(
        async ({ data }: { data: object }) => ({
          id: `event_${Math.random().toString(36).slice(2)}`,
          ...data,
        })
      ),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  } as unknown as CommissionDb;
}

const dealInput: StageCommissionsInput = {
  dealId: "deal_1",
  partnerId: "partner_1",
  productCode: "ARIES_AI",
  packageCode: null,
  amountCents: 500000,
  currency: "USD",
  closedAt: new Date("2025-01-15"),
  rules: [],
};

// ---------------------------------------------------------------------------
// calculateUpfrontAmount
// ---------------------------------------------------------------------------

describe("calculateUpfrontAmount", () => {
  it("calculates percentage-based commission from percentBps", () => {
    // 10% of $5000 (500000 cents) = $500 (50000 cents)
    expect(calculateUpfrontAmount(percentRule, 500000)).toBe(50000);
  });

  it("rounds fractional cents for percentage rules", () => {
    // 10% of 333 = 33.3 → 33
    expect(calculateUpfrontAmount(percentRule, 333)).toBe(33);
  });

  it("returns flatAmountCents for flat rules regardless of revenue", () => {
    expect(calculateUpfrontAmount(flatRule, 500000)).toBe(50000);
    expect(calculateUpfrontAmount(flatRule, 1000000)).toBe(50000);
  });

  it("throws if neither percentBps nor flatAmountCents is set", () => {
    const invalid: CommissionRuleSnapshot = {
      ...percentRule,
      percentBps: null,
      flatAmountCents: null,
    };
    expect(() => calculateUpfrontAmount(invalid, 500000)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildTrailingPeriods
// ---------------------------------------------------------------------------

describe("buildTrailingPeriods", () => {
  it("returns one period per trailing month", () => {
    const periods = buildTrailingPeriods(new Date("2025-01-15"), 3);
    expect(periods).toHaveLength(3);
  });

  it("each period starts on the first of the month", () => {
    const periods = buildTrailingPeriods(new Date("2025-01-15"), 3);
    for (const p of periods) {
      expect(p.periodStart.getDate()).toBe(1);
    }
  });

  it("first period starts at the beginning of the month after close", () => {
    const periods = buildTrailingPeriods(new Date("2025-01-15"), 1);
    const p = periods[0];
    // Feb 2025
    expect(p.periodStart.getFullYear()).toBe(2025);
    expect(p.periodStart.getMonth()).toBe(1); // 0-indexed February
  });

  it("period ends on the last day of the month", () => {
    const periods = buildTrailingPeriods(new Date("2025-01-15"), 2);
    // periods[0] = Feb 2025 (28 days, not leap year)
    expect(periods[0].periodEnd.getDate()).toBe(28);
    // periods[1] = Mar 2025 (31 days)
    expect(periods[1].periodEnd.getDate()).toBe(31);
  });

  it("handles year rollover correctly (Dec close → Jan trailing)", () => {
    const periods = buildTrailingPeriods(new Date("2024-12-15"), 1);
    expect(periods[0].periodStart.getFullYear()).toBe(2025);
    expect(periods[0].periodStart.getMonth()).toBe(0); // January
  });

  it("returns empty array for 0 trailing months", () => {
    expect(buildTrailingPeriods(new Date("2025-01-15"), 0)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — UPFRONT percentage
// ---------------------------------------------------------------------------

describe("stageCommissions — UPFRONT percentage rule", () => {
  it("creates one UPFRONT event", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("UPFRONT");
  });

  it("calculates correct amount (10% of 500000 = 50000)", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].amountCents).toBe(50000);
  });

  it("snapshots tierName on the event", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].tierNameSnapshot).toBe("Affiliate");
  });

  it("snapshots productCode on the event", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].productCodeSnapshot).toBe("ARIES_AI");
  });

  it("snapshots percentBps on the event", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].percentBpsSnapshot).toBe(1000);
  });

  it("sets sourceRevenueCents to amountCents", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].sourceRevenueCents).toBe(500000);
  });

  it("sets payoutEligibleAt to closedAt + payoutDelayDays", async () => {
    const db = makeCommissionDb();
    const closedAt = new Date("2025-01-15");
    const events = await stageCommissions(
      { ...dealInput, closedAt, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    const expectedEligible = new Date(closedAt);
    expectedEligible.setDate(expectedEligible.getDate() + 30);
    expect(events[0].payoutEligibleAt.toDateString()).toBe(
      expectedEligible.toDateString()
    );
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — UPFRONT flat
// ---------------------------------------------------------------------------

describe("stageCommissions — UPFRONT flat rule", () => {
  it("creates one UPFRONT event with flat amount", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [flatRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].amountCents).toBe(50000);
  });

  it("snapshots flatAmountCents on the event", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [flatRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].flatAmountCentsSnapshot).toBe(50000);
  });

  it("sets percentBpsSnapshot to null for flat rules", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [flatRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events[0].percentBpsSnapshot).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — TRAILING
// ---------------------------------------------------------------------------

describe("stageCommissions — TRAILING rule", () => {
  it("creates one TRAILING event per trailing month", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events).toHaveLength(3);
    expect(events.every((e) => e.kind === "TRAILING")).toBe(true);
  });

  it("each trailing event has a distinct periodStart", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    const starts = events.map((e) =>
      (e.periodStart as Date).toISOString()
    );
    expect(new Set(starts).size).toBe(3);
  });

  it("each trailing event has a distinct periodEnd", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    const ends = events.map((e) => (e.periodEnd as Date).toISOString());
    expect(new Set(ends).size).toBe(3);
  });

  it("calculates trailing amount per period (5% of 500000 = 25000)", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    for (const e of events) {
      expect(e.amountCents).toBe(25000);
    }
  });

  it("sets payoutEligibleAt to periodEnd + payoutDelayDays for trailing events", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    for (const e of events) {
      const periodEnd = e.periodEnd as Date;
      const expected = new Date(periodEnd);
      expected.setDate(expected.getDate() + 30);
      expect((e.payoutEligibleAt as Date).toDateString()).toBe(
        expected.toDateString()
      );
    }
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — multiple rules
// ---------------------------------------------------------------------------

describe("stageCommissions — multiple rules", () => {
  it("stages events for each rule (1 UPFRONT + 3 TRAILING = 4 events)", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule, trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — idempotency (find-before-create)
// ---------------------------------------------------------------------------

describe("stageCommissions — idempotency", () => {
  it("returns existing UPFRONT event without creating a duplicate", async () => {
    const existing = {
      id: "event_existing",
      dealId: "deal_1",
      kind: "UPFRONT",
      periodStart: null,
      amountCents: 50000,
      tierNameSnapshot: "Affiliate",
      productCodeSnapshot: "ARIES_AI",
      percentBpsSnapshot: 1000,
      flatAmountCentsSnapshot: null,
      payoutEligibleAt: new Date(),
    };

    const db = makeCommissionDb();
    vi.mocked(db.commissionEvent.findFirst).mockResolvedValue(
      existing as unknown as ReturnType<
        (typeof db.commissionEvent.findFirst) extends (...args: unknown[]) => Promise<infer R> ? () => R : never
      >
    );

    const events = await stageCommissions(
      { ...dealInput, rules: [percentRule] },
      { db, actor: { type: "SYSTEM" } }
    );

    expect(events[0].id).toBe("event_existing");
    expect(db.commissionEvent.create).not.toHaveBeenCalled();
  });

  it("creates new events only for periods without existing events", async () => {
    const existingPeriodStart = new Date("2025-02-01");
    const existing = {
      id: "event_trailing_1",
      dealId: "deal_1",
      kind: "TRAILING",
      periodStart: existingPeriodStart,
      amountCents: 25000,
      payoutEligibleAt: new Date(),
    };

    const db = makeCommissionDb();
    // First call returns existing, subsequent calls return null
    vi.mocked(db.commissionEvent.findFirst).mockResolvedValueOnce(
      existing as unknown as CommissionEventRow
    );

    const events = await stageCommissions(
      { ...dealInput, rules: [trailingRule] },
      { db, actor: { type: "SYSTEM" } }
    );

    expect(events[0].id).toBe("event_trailing_1");
    // 2 new events created (periods 2 and 3)
    expect(db.commissionEvent.create).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — historical immutability via snapshots
// ---------------------------------------------------------------------------

describe("stageCommissions — historical immutability", () => {
  it("snapshots the rule percentBps at time of staging", async () => {
    const db = makeCommissionDb();
    const rule: CommissionRuleSnapshot = { ...percentRule, percentBps: 1500 }; // 15%

    const events = await stageCommissions(
      { ...dealInput, rules: [rule] },
      { db, actor: { type: "SYSTEM" } }
    );

    // Snapshot captures 1500 — any future rule edit won't affect this event
    expect(events[0].percentBpsSnapshot).toBe(1500);
    expect(events[0].amountCents).toBe(75000); // 15% of 500000
  });

  it("snapshots tierName so tier renames do not affect historical events", async () => {
    const db = makeCommissionDb();
    const rule: CommissionRuleSnapshot = {
      ...percentRule,
      tierName: "Gold Reseller",
    };

    const events = await stageCommissions(
      { ...dealInput, rules: [rule] },
      { db, actor: { type: "SYSTEM" } }
    );

    expect(events[0].tierNameSnapshot).toBe("Gold Reseller");
  });

  it("snapshots packageCode on the event", async () => {
    const db = makeCommissionDb();
    const rule: CommissionRuleSnapshot = {
      ...percentRule,
      packageCode: "ENTERPRISE",
    };

    const events = await stageCommissions(
      { ...dealInput, rules: [rule] },
      { db, actor: { type: "SYSTEM" } }
    );

    expect(events[0].packageCodeSnapshot).toBe("ENTERPRISE");
  });
});

// ---------------------------------------------------------------------------
// stageCommissions — no rules
// ---------------------------------------------------------------------------

describe("stageCommissions — no rules", () => {
  it("returns empty array when no rules apply", async () => {
    const db = makeCommissionDb();
    const events = await stageCommissions(
      { ...dealInput, rules: [] },
      { db, actor: { type: "SYSTEM" } }
    );
    expect(events).toHaveLength(0);
  });
});
