import { describe, it, expect, vi } from "vitest";
import {
  getQuarterBounds,
  computeQuarterlyActivity,
  evaluateAgainstTierRequirements,
  setActivityOverride,
  getActivitySnapshot,
  type ActivityDb,
  type ActivityOverrideStatus,
  type QuarterlyActivitySnapshotRow,
} from "@/domain/activity/service";
import type { SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const adminUser: SessionUser = { id: "admin_1", role: "ADMIN", status: "ACTIVE" };
const partnerUser: SessionUser = { id: "partner_1", role: "PARTNER", status: "ACTIVE" };

function makeSnapshot(overrides?: Partial<QuarterlyActivitySnapshotRow>): QuarterlyActivitySnapshotRow {
  return {
    id: "snap_1",
    partnerId: "partner_1",
    quarter: "2025-Q1",
    referralsSubmitted: 0,
    referralsApproved: 0,
    dealsWon: 0,
    revenueCents: 0,
    commissionCents: 0,
    overrideStatus: null,
    overrideReason: null,
    generatedAt: new Date("2025-04-01"),
    ...overrides,
  };
}

function makeDb(opts: {
  referralCount?: number;
  referralApprovedCount?: number;
  dealCount?: number;
  deals?: Array<{ amountCents: number }>;
  commissionEvents?: Array<{ amountCents: number; kind: string }>;
  snapshot?: QuarterlyActivitySnapshotRow | null;
  upsertResult?: QuarterlyActivitySnapshotRow;
} = {}): ActivityDb {
  return {
    referral: {
      count: vi.fn(async (args: { where?: { status?: string } }) => {
        if (args?.where?.status === "APPROVED") {
          return opts.referralApprovedCount ?? 0;
        }
        return opts.referralCount ?? 0;
      }),
    },
    deal: {
      findMany: vi.fn(async () => opts.deals ?? []),
      count: vi.fn(async () => opts.dealCount ?? 0),
    },
    commissionEvent: {
      findMany: vi.fn(async () => opts.commissionEvents ?? []),
    },
    commissionRule: {
      findMany: vi.fn(async () => []),
    },
    partner: {
      findUnique: vi.fn(async () => null),
    },
    quarterlyActivitySnapshot: {
      findUnique: vi.fn(async () =>
        opts.snapshot !== undefined ? opts.snapshot : null
      ),
      upsert: vi.fn(async () =>
        opts.upsertResult ?? makeSnapshot()
      ),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  };
}

// ---------------------------------------------------------------------------
// getQuarterBounds
// ---------------------------------------------------------------------------

describe("getQuarterBounds", () => {
  it("Q1: Jan 1 - Apr 1", () => {
    const { start, end } = getQuarterBounds("2025-Q1");
    expect(start).toEqual(new Date(2025, 0, 1));
    expect(end).toEqual(new Date(2025, 3, 1));
  });

  it("Q2: Apr 1 - Jul 1", () => {
    const { start, end } = getQuarterBounds("2025-Q2");
    expect(start).toEqual(new Date(2025, 3, 1));
    expect(end).toEqual(new Date(2025, 6, 1));
  });

  it("Q3: Jul 1 - Oct 1", () => {
    const { start, end } = getQuarterBounds("2025-Q3");
    expect(start).toEqual(new Date(2025, 6, 1));
    expect(end).toEqual(new Date(2025, 9, 1));
  });

  it("Q4: Oct 1 - Jan 1 of next year", () => {
    const { start, end } = getQuarterBounds("2025-Q4");
    expect(start).toEqual(new Date(2025, 9, 1));
    expect(end).toEqual(new Date(2026, 0, 1));
  });

  it("Q4 year boundary: end year is incremented", () => {
    const { start, end } = getQuarterBounds("2024-Q4");
    expect(start.getFullYear()).toBe(2024);
    expect(end.getFullYear()).toBe(2025);
    expect(end.getMonth()).toBe(0); // January
  });
});

// ---------------------------------------------------------------------------
// computeQuarterlyActivity
// ---------------------------------------------------------------------------

describe("computeQuarterlyActivity", () => {
  it("aggregates all 5 metrics correctly", async () => {
    const db = makeDb({
      referralCount: 10,
      referralApprovedCount: 7,
      dealCount: 3,
      deals: [{ amountCents: 50000 }, { amountCents: 30000 }, { amountCents: 20000 }],
      commissionEvents: [
        { amountCents: 5000, kind: "UPFRONT" },
        { amountCents: 2000, kind: "TRAILING" },
      ],
    });

    const result = await computeQuarterlyActivity("partner_1", "2025-Q1", {
      db,
      actor: adminUser,
    });

    expect(result.partnerId).toBe("partner_1");
    expect(result.quarter).toBe("2025-Q1");
    expect(result.referralsSubmitted).toBe(10);
    expect(result.referralsApproved).toBe(7);
    expect(result.dealsWon).toBe(3);
    expect(result.revenueCents).toBe(100000);
    expect(result.commissionCents).toBe(7000);
  });

  it("returns zeros when no data exists", async () => {
    const db = makeDb();

    const result = await computeQuarterlyActivity("partner_1", "2025-Q2", {
      db,
      actor: adminUser,
    });

    expect(result.referralsSubmitted).toBe(0);
    expect(result.referralsApproved).toBe(0);
    expect(result.dealsWon).toBe(0);
    expect(result.revenueCents).toBe(0);
    expect(result.commissionCents).toBe(0);
  });

  it("queries submitted referrals by submittedAt within the quarter", async () => {
    const db = makeDb({ referralCount: 5 });

    await computeQuarterlyActivity("partner_1", "2025-Q2", {
      db,
      actor: adminUser,
    });

    const { start, end } = getQuarterBounds("2025-Q2");
    expect(db.referral.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          partnerId: "partner_1",
          submittedAt: { gte: start, lt: end },
        }),
      })
    );
  });

  it("queries approved referrals by reviewedAt within the quarter", async () => {
    const db = makeDb({ referralApprovedCount: 3 });

    await computeQuarterlyActivity("partner_1", "2025-Q1", {
      db,
      actor: adminUser,
    });

    const { start, end } = getQuarterBounds("2025-Q1");
    expect(db.referral.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          partnerId: "partner_1",
          status: "APPROVED",
          reviewedAt: { gte: start, lt: end },
        }),
      })
    );
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb();
    await expect(
      computeQuarterlyActivity("partner_1", "2025-Q1", { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// evaluateAgainstTierRequirements
// ---------------------------------------------------------------------------

describe("evaluateAgainstTierRequirements", () => {
  const baseActivity = {
    partnerId: "partner_1",
    quarter: "2025-Q1",
    referralsSubmitted: 10,
    referralsApproved: 5,
    dealsWon: 2,
    revenueCents: 50000,
    commissionCents: 5000,
  };

  it("returns meetsRequirements: true when approved referrals meets minimum", () => {
    const rules = [{ id: "rule_1", quarterlyMinReferrals: 5, isActive: true }];
    const result = evaluateAgainstTierRequirements(baseActivity, rules);
    expect(result.meetsRequirements).toBe(true);
    expect(result.minimumReferralsRequired).toBe(5);
    expect(result.referralsApproved).toBe(5);
  });

  it("returns meetsRequirements: false when approved referrals is below minimum", () => {
    const rules = [{ id: "rule_1", quarterlyMinReferrals: 10, isActive: true }];
    const result = evaluateAgainstTierRequirements(baseActivity, rules);
    expect(result.meetsRequirements).toBe(false);
    expect(result.minimumReferralsRequired).toBe(10);
    expect(result.referralsApproved).toBe(5);
  });

  it("returns minimumReferralsRequired: null when no rules have quarterlyMinReferrals", () => {
    const rules = [{ id: "rule_1", quarterlyMinReferrals: null, isActive: true }];
    const result = evaluateAgainstTierRequirements(baseActivity, rules);
    expect(result.meetsRequirements).toBe(true);
    expect(result.minimumReferralsRequired).toBeNull();
  });

  it("returns minimumReferralsRequired: null when rules array is empty", () => {
    const result = evaluateAgainstTierRequirements(baseActivity, []);
    expect(result.meetsRequirements).toBe(true);
    expect(result.minimumReferralsRequired).toBeNull();
  });

  it("ignores inactive rules", () => {
    const rules = [
      { id: "rule_1", quarterlyMinReferrals: 20, isActive: false },
      { id: "rule_2", quarterlyMinReferrals: 3, isActive: true },
    ];
    const result = evaluateAgainstTierRequirements(baseActivity, rules);
    expect(result.meetsRequirements).toBe(true);
    expect(result.minimumReferralsRequired).toBe(3);
  });

  it("uses highest minimum when multiple rules with minimums exist", () => {
    const rules = [
      { id: "rule_1", quarterlyMinReferrals: 3, isActive: true },
      { id: "rule_2", quarterlyMinReferrals: 8, isActive: true },
    ];
    const result = evaluateAgainstTierRequirements(baseActivity, rules);
    expect(result.minimumReferralsRequired).toBe(8);
    expect(result.meetsRequirements).toBe(false); // activity has 5, need 8
  });
});

// ---------------------------------------------------------------------------
// setActivityOverride
// ---------------------------------------------------------------------------

describe("setActivityOverride", () => {
  it("upserts snapshot with override fields", async () => {
    const upsertResult = makeSnapshot({
      overrideStatus: "ACTIVE",
      overrideReason: "Partner had system issues",
    });
    const db = makeDb({ upsertResult });

    const result = await setActivityOverride(
      "partner_1",
      "2025-Q1",
      "ACTIVE",
      "Partner had system issues",
      { db, actor: adminUser }
    );

    expect(db.quarterlyActivitySnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { partnerId_quarter: { partnerId: "partner_1", quarter: "2025-Q1" } },
        update: { overrideStatus: "ACTIVE", overrideReason: "Partner had system issues" },
      })
    );
    expect(result.overrideStatus).toBe("ACTIVE");
    expect(result.overrideReason).toBe("Partner had system issues");
  });

  it("writes an audit log with ACTIVITY_OVERRIDE_SET action", async () => {
    const db = makeDb();

    await setActivityOverride(
      "partner_1",
      "2025-Q1",
      "ACTIVE",
      "Manual override reason",
      { db, actor: adminUser }
    );

    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "ACTIVITY_OVERRIDE_SET",
          entityType: "QuarterlyActivitySnapshot",
        }),
      })
    );
  });

  it("throws when overrideReason is empty", async () => {
    const db = makeDb();
    await expect(
      setActivityOverride("partner_1", "2025-Q1", "ACTIVE", "", { db, actor: adminUser })
    ).rejects.toThrow(/reason/i);
  });

  it("throws when overrideReason is whitespace only", async () => {
    const db = makeDb();
    await expect(
      setActivityOverride("partner_1", "2025-Q1", "ACTIVE", "   ", { db, actor: adminUser })
    ).rejects.toThrow(/reason/i);
  });

  it("throws when overrideStatus is not a valid value", async () => {
    const db = makeDb();
    await expect(
      setActivityOverride(
        "partner_1",
        "2025-Q1",
        "INVALID_STATUS" as ActivityOverrideStatus,
        "Some reason",
        { db, actor: adminUser }
      )
    ).rejects.toThrow(/invalid overridestatus/i);
  });

  it("invokes the create path when no snapshot exists (zeroed metrics)", async () => {
    const upsertResult = makeSnapshot({
      overrideStatus: "PROBATION",
      overrideReason: "First quarter below target",
      referralsSubmitted: 0,
      referralsApproved: 0,
    });
    const db = makeDb({ upsertResult });

    await setActivityOverride(
      "partner_1",
      "2025-Q1",
      "PROBATION",
      "First quarter below target",
      { db, actor: adminUser }
    );

    expect(db.quarterlyActivitySnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          referralsSubmitted: 0,
          referralsApproved: 0,
          dealsWon: 0,
          revenueCents: 0,
          commissionCents: 0,
        }),
      })
    );
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb();
    await expect(
      setActivityOverride("partner_1", "2025-Q1", "ACTIVE", "Some reason", {
        db,
        actor: partnerUser,
      })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// getActivitySnapshot
// ---------------------------------------------------------------------------

describe("getActivitySnapshot", () => {
  it("returns null when no snapshot exists", async () => {
    const db = makeDb({ snapshot: null });
    const result = await getActivitySnapshot("partner_1", "2025-Q1", {
      db,
      actor: adminUser,
    });
    expect(result).toBeNull();
  });

  it("returns the stored snapshot when present", async () => {
    const snap = makeSnapshot({
      overrideStatus: "ACTIVE",
      overrideReason: "Test override",
    });
    const db = makeDb({ snapshot: snap });

    const result = await getActivitySnapshot("partner_1", "2025-Q1", {
      db,
      actor: adminUser,
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe("snap_1");
    expect(result?.overrideStatus).toBe("ACTIVE");
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({ snapshot: null });
    await expect(
      getActivitySnapshot("partner_1", "2025-Q1", { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});
