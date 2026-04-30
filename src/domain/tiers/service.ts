import { createAuditWriter, type AuditClient } from "@/lib/audit";
import { requireAdmin, type SessionUser } from "@/lib/access-control";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TierRow = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CommissionRuleRow = {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any;

export type TierDb = AuditClient & {
  tier: {
    findUnique: (args: AnyArgs) => Promise<TierRow | null>;
    create: (args: AnyArgs) => Promise<TierRow>;
    update: (args: AnyArgs) => Promise<TierRow>;
  };
  commissionRule: {
    findUnique: (args: AnyArgs) => Promise<CommissionRuleRow | null>;
    create: (args: AnyArgs) => Promise<CommissionRuleRow>;
    update: (args: AnyArgs) => Promise<CommissionRuleRow>;
  };
  partner: {
    count: (args: AnyArgs) => Promise<number>;
  };
};

export type TierServiceDeps = {
  db: TierDb;
  actor: SessionUser;
};

// ---------------------------------------------------------------------------
// createTier
// ---------------------------------------------------------------------------

export type CreateTierInput = {
  name: string;
  description?: string | null;
};

export async function createTier(
  input: CreateTierInput,
  deps: TierServiceDeps
): Promise<TierRow> {
  requireAdmin(deps.actor);

  const tier = await deps.db.tier.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      isDefault: false,
      isActive: true,
    },
  });

  const audit = createAuditWriter(deps.db);
  await audit({ type: "USER", id: deps.actor.id }, "TIER_CREATED", "Tier", tier.id, {
    after: { name: input.name },
  });

  return tier;
}

// ---------------------------------------------------------------------------
// updateTier
// ---------------------------------------------------------------------------

export type UpdateTierInput = {
  tierId: string;
  name?: string;
  description?: string | null;
};

export async function updateTier(
  input: UpdateTierInput,
  deps: TierServiceDeps
): Promise<TierRow> {
  requireAdmin(deps.actor);

  const existing = await deps.db.tier.findUnique({ where: { id: input.tierId } });
  if (!existing) {
    throw new Error(`Tier not found: ${input.tierId}`);
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;

  const updated = await deps.db.tier.update({
    where: { id: input.tierId },
    data: updateData,
  });

  const audit = createAuditWriter(deps.db);
  await audit({ type: "USER", id: deps.actor.id }, "TIER_UPDATED", "Tier", updated.id, {
    before: { name: existing.name, description: existing.description },
    after: { name: updated.name, description: updated.description },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// deactivateTier
//
// Prevents destructive deletion. Use deactivate only.
// Blocks if any partners are still assigned to this tier.
// ---------------------------------------------------------------------------

export async function deactivateTier(
  tierId: string,
  deps: TierServiceDeps
): Promise<TierRow> {
  requireAdmin(deps.actor);

  const existing = await deps.db.tier.findUnique({ where: { id: tierId } });
  if (!existing) {
    throw new Error(`Tier not found: ${tierId}`);
  }

  const partnerCount = await deps.db.partner.count({ where: { tierId } });
  if (partnerCount > 0) {
    throw new Error(
      `Cannot deactivate tier "${existing.name}" — it has ${partnerCount} partner(s) assigned. ` +
        `Reassign all partners before deactivating.`
    );
  }

  const updated = await deps.db.tier.update({
    where: { id: tierId },
    data: { isActive: false },
  });

  const audit = createAuditWriter(deps.db);
  await audit({ type: "USER", id: deps.actor.id }, "TIER_DEACTIVATED", "Tier", tierId, {
    before: { isActive: true },
    after: { isActive: false },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// createCommissionRule
// ---------------------------------------------------------------------------

export type CreateCommissionRuleInput = {
  tierId: string;
  productCode: string;
  packageCode?: string | null;
  kind: "UPFRONT" | "TRAILING" | "CLAWBACK" | "ADJUSTMENT";
  percentBps?: number | null;
  flatAmountCents?: number | null;
  currency?: string;
  trailingMonths?: number | null;
  payoutDelayDays?: number;
  clawbackWindowDays?: number;
  quarterlyMinReferrals?: number | null;
};

export async function createCommissionRule(
  input: CreateCommissionRuleInput,
  deps: TierServiceDeps
): Promise<CommissionRuleRow> {
  requireAdmin(deps.actor);

  const tier = await deps.db.tier.findUnique({ where: { id: input.tierId } });
  if (!tier) {
    throw new Error(`Tier not found: ${input.tierId}`);
  }

  const rule = await deps.db.commissionRule.create({
    data: {
      tierId: input.tierId,
      productCode: input.productCode,
      packageCode: input.packageCode ?? null,
      kind: input.kind,
      percentBps: input.percentBps ?? null,
      flatAmountCents: input.flatAmountCents ?? null,
      currency: input.currency ?? "USD",
      trailingMonths: input.trailingMonths ?? null,
      payoutDelayDays: input.payoutDelayDays ?? 30,
      clawbackWindowDays: input.clawbackWindowDays ?? 90,
      quarterlyMinReferrals: input.quarterlyMinReferrals ?? null,
      isActive: true,
    },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "COMMISSION_RULE_CREATED",
    "CommissionRule",
    rule.id,
    {
      after: { tierId: input.tierId, productCode: input.productCode, kind: input.kind },
    }
  );

  return rule;
}

// ---------------------------------------------------------------------------
// updateCommissionRule
// ---------------------------------------------------------------------------

export type UpdateCommissionRuleInput = {
  ruleId: string;
  percentBps?: number | null;
  flatAmountCents?: number | null;
  trailingMonths?: number | null;
  payoutDelayDays?: number;
  clawbackWindowDays?: number;
  quarterlyMinReferrals?: number | null;
};

export async function updateCommissionRule(
  input: UpdateCommissionRuleInput,
  deps: TierServiceDeps
): Promise<CommissionRuleRow> {
  requireAdmin(deps.actor);

  const existing = await deps.db.commissionRule.findUnique({ where: { id: input.ruleId } });
  if (!existing) {
    throw new Error(`Commission rule not found: ${input.ruleId}`);
  }

  const updateData: Record<string, unknown> = {};
  if (input.percentBps !== undefined) updateData.percentBps = input.percentBps;
  if (input.flatAmountCents !== undefined) updateData.flatAmountCents = input.flatAmountCents;
  if (input.trailingMonths !== undefined) updateData.trailingMonths = input.trailingMonths;
  if (input.payoutDelayDays !== undefined) updateData.payoutDelayDays = input.payoutDelayDays;
  if (input.clawbackWindowDays !== undefined) updateData.clawbackWindowDays = input.clawbackWindowDays;
  if (input.quarterlyMinReferrals !== undefined)
    updateData.quarterlyMinReferrals = input.quarterlyMinReferrals;

  const updated = await deps.db.commissionRule.update({
    where: { id: input.ruleId },
    data: updateData,
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "COMMISSION_RULE_UPDATED",
    "CommissionRule",
    input.ruleId,
    { before: existing as unknown as Record<string, unknown>, after: updateData }
  );

  return updated;
}

// ---------------------------------------------------------------------------
// deactivateCommissionRule
// ---------------------------------------------------------------------------

export async function deactivateCommissionRule(
  ruleId: string,
  deps: TierServiceDeps
): Promise<CommissionRuleRow> {
  requireAdmin(deps.actor);

  const rule = await deps.db.commissionRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    throw new Error(`Commission rule not found: ${ruleId}`);
  }

  const updated = await deps.db.commissionRule.update({
    where: { id: ruleId },
    data: { isActive: false },
  });

  const audit = createAuditWriter(deps.db);
  await audit(
    { type: "USER", id: deps.actor.id },
    "COMMISSION_RULE_DEACTIVATED",
    "CommissionRule",
    ruleId,
    { before: { isActive: true }, after: { isActive: false } }
  );

  return updated;
}
