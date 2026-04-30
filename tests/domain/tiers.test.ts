import { describe, it, expect, vi } from "vitest";
import {
  createTier,
  updateTier,
  deactivateTier,
  createCommissionRule,
  deactivateCommissionRule,
  type TierDb,
  type TierRow,
  type CommissionRuleRow,
} from "@/domain/tiers/service";
import type { SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const adminUser: SessionUser = { id: "admin_1", role: "ADMIN", status: "ACTIVE" };
const partnerUser: SessionUser = { id: "partner_1", role: "PARTNER", status: "ACTIVE" };

function makeTier(overrides?: Partial<TierRow>): TierRow {
  return {
    id: "tier_1",
    name: "Custom Tier",
    description: null,
    isDefault: false,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function makeRule(overrides?: Partial<CommissionRuleRow>): CommissionRuleRow {
  return {
    id: "rule_1",
    tierId: "tier_1",
    productCode: "ARIES_AI",
    packageCode: null,
    kind: "UPFRONT",
    percentBps: 1000,
    flatAmountCents: null,
    currency: "USD",
    trailingMonths: null,
    payoutDelayDays: 30,
    clawbackWindowDays: 90,
    quarterlyMinReferrals: null,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function makeDb(opts: {
  tier?: TierRow | null;
  rule?: CommissionRuleRow | null;
  partnerCount?: number;
}): TierDb {
  return {
    tier: {
      findUnique: vi.fn(async () => (opts.tier !== undefined ? opts.tier : null)),
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: "tier_new",
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })) as TierDb["tier"]["create"],
      update: vi.fn(async ({ data }: { data: object }) => ({
        ...(opts.tier ?? makeTier()),
        ...data,
        updatedAt: new Date(),
      })) as TierDb["tier"]["update"],
    },
    commissionRule: {
      findUnique: vi.fn(async () => (opts.rule !== undefined ? opts.rule : null)),
      create: vi.fn(async ({ data }: { data: object }) => ({
        id: "rule_new",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })) as TierDb["commissionRule"]["create"],
      update: vi.fn(async ({ data }: { data: object }) => ({
        ...(opts.rule ?? makeRule()),
        ...data,
        updatedAt: new Date(),
      })) as TierDb["commissionRule"]["update"],
    },
    partner: {
      count: vi.fn(async () => opts.partnerCount ?? 0),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
    },
  };
}

// ---------------------------------------------------------------------------
// createTier
// ---------------------------------------------------------------------------

describe("createTier", () => {
  it("creates a tier and writes an audit log", async () => {
    const db = makeDb({});
    const result = await createTier({ name: "Gold Partner" }, { db, actor: adminUser });

    expect(db.tier.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Gold Partner" }) })
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "TIER_CREATED", entityType: "Tier" }),
      })
    );
    expect(result.name).toBe("Gold Partner");
  });

  it("throws Forbidden when called by a non-admin", async () => {
    const db = makeDb({});
    await expect(
      createTier({ name: "Gold" }, { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });

  it("creates with description", async () => {
    const db = makeDb({});
    await createTier({ name: "Silver", description: "Mid-tier reseller" }, { db, actor: adminUser });
    expect(db.tier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: "Mid-tier reseller" }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// updateTier
// ---------------------------------------------------------------------------

describe("updateTier", () => {
  it("updates tier name and writes audit log", async () => {
    const tier = makeTier({ name: "Old Name" });
    const db = makeDb({ tier });

    await updateTier({ tierId: "tier_1", name: "New Name" }, { db, actor: adminUser });

    expect(db.tier.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "New Name" }) })
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "TIER_UPDATED" }),
      })
    );
  });

  it("throws when tier not found", async () => {
    const db = makeDb({ tier: null });
    await expect(
      updateTier({ tierId: "tier_missing" }, { db, actor: adminUser })
    ).rejects.toThrow("Tier not found");
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({ tier: makeTier() });
    await expect(
      updateTier({ tierId: "tier_1", name: "X" }, { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// deactivateTier
// ---------------------------------------------------------------------------

describe("deactivateTier", () => {
  it("deactivates tier when no partners are assigned", async () => {
    const tier = makeTier({ isActive: true });
    const db = makeDb({ tier, partnerCount: 0 });

    const result = await deactivateTier("tier_1", { db, actor: adminUser });

    expect(db.tier.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "TIER_DEACTIVATED" }),
      })
    );
    expect(result.isActive).toBe(false);
  });

  it("throws when tier has active partners", async () => {
    const tier = makeTier({ isActive: true });
    const db = makeDb({ tier, partnerCount: 3 });

    await expect(
      deactivateTier("tier_1", { db, actor: adminUser })
    ).rejects.toThrow(/partner/i);
  });

  it("throws when tier not found", async () => {
    const db = makeDb({ tier: null, partnerCount: 0 });
    await expect(
      deactivateTier("tier_missing", { db, actor: adminUser })
    ).rejects.toThrow("Tier not found");
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({ tier: makeTier(), partnerCount: 0 });
    await expect(
      deactivateTier("tier_1", { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// createCommissionRule
// ---------------------------------------------------------------------------

describe("createCommissionRule", () => {
  it("creates a commission rule for an existing tier", async () => {
    const tier = makeTier();
    const db = makeDb({ tier });

    const result = await createCommissionRule(
      {
        tierId: "tier_1",
        productCode: "ARIES_AI",
        kind: "UPFRONT",
        percentBps: 1000,
        payoutDelayDays: 30,
        clawbackWindowDays: 90,
      },
      { db, actor: adminUser }
    );

    expect(db.commissionRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tierId: "tier_1",
          productCode: "ARIES_AI",
          kind: "UPFRONT",
          percentBps: 1000,
        }),
      })
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "COMMISSION_RULE_CREATED" }),
      })
    );
    expect(result).toBeDefined();
  });

  it("defaults payoutDelayDays to 30 and clawbackWindowDays to 90", async () => {
    const db = makeDb({ tier: makeTier() });
    await createCommissionRule(
      { tierId: "tier_1", productCode: "ARIES_AI", kind: "TRAILING", trailingMonths: 6 },
      { db, actor: adminUser }
    );
    expect(db.commissionRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ payoutDelayDays: 30, clawbackWindowDays: 90 }),
      })
    );
  });

  it("throws when tier not found", async () => {
    const db = makeDb({ tier: null });
    await expect(
      createCommissionRule(
        { tierId: "tier_missing", productCode: "ARIES_AI", kind: "UPFRONT" },
        { db, actor: adminUser }
      )
    ).rejects.toThrow("Tier not found");
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({ tier: makeTier() });
    await expect(
      createCommissionRule(
        { tierId: "tier_1", productCode: "ARIES_AI", kind: "UPFRONT" },
        { db, actor: partnerUser }
      )
    ).rejects.toThrow("Forbidden");
  });
});

// ---------------------------------------------------------------------------
// deactivateCommissionRule
// ---------------------------------------------------------------------------

describe("deactivateCommissionRule", () => {
  it("deactivates an active rule and writes audit log", async () => {
    const rule = makeRule({ isActive: true });
    const db = makeDb({ rule });

    const result = await deactivateCommissionRule("rule_1", { db, actor: adminUser });

    expect(db.commissionRule.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "COMMISSION_RULE_DEACTIVATED" }),
      })
    );
    expect(result.isActive).toBe(false);
  });

  it("throws when rule not found", async () => {
    const db = makeDb({ rule: null });
    await expect(
      deactivateCommissionRule("rule_missing", { db, actor: adminUser })
    ).rejects.toThrow("Commission rule not found");
  });

  it("throws Forbidden for non-admin", async () => {
    const db = makeDb({ rule: makeRule() });
    await expect(
      deactivateCommissionRule("rule_1", { db, actor: partnerUser })
    ).rejects.toThrow("Forbidden");
  });
});
