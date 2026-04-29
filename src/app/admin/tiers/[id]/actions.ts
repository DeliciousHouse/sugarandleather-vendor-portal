"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import {
  createTier,
  updateTier,
  deactivateTier,
  createCommissionRule,
  deactivateCommissionRule,
  type TierDb,
  type CreateTierInput,
  type UpdateTierInput,
  type CreateCommissionRuleInput,
} from "@/domain/tiers/service";

export type TierActionState = { ok: true; id?: string } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// createTierAction
// ---------------------------------------------------------------------------

export async function createTierAction(
  input: CreateTierInput
): Promise<TierActionState> {
  const actor = await getRequiredAdmin();
  try {
    const tier = await createTier(input, {
      db: prisma as unknown as TierDb,
      actor,
    });
    return { ok: true, id: tier.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create tier.",
    };
  }
}

// ---------------------------------------------------------------------------
// updateTierAction
// ---------------------------------------------------------------------------

export async function updateTierAction(
  input: UpdateTierInput
): Promise<TierActionState> {
  const actor = await getRequiredAdmin();
  try {
    await updateTier(input, {
      db: prisma as unknown as TierDb,
      actor,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update tier.",
    };
  }
}

// ---------------------------------------------------------------------------
// deactivateTierAction
// ---------------------------------------------------------------------------

export async function deactivateTierAction(tierId: string): Promise<TierActionState> {
  const actor = await getRequiredAdmin();
  try {
    await deactivateTier(tierId, {
      db: prisma as unknown as TierDb,
      actor,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to deactivate tier.",
    };
  }
}

// ---------------------------------------------------------------------------
// createCommissionRuleAction
// ---------------------------------------------------------------------------

export async function createCommissionRuleAction(
  input: CreateCommissionRuleInput
): Promise<TierActionState> {
  const actor = await getRequiredAdmin();
  try {
    const rule = await createCommissionRule(input, {
      db: prisma as unknown as TierDb,
      actor,
    });
    return { ok: true, id: rule.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create commission rule.",
    };
  }
}

// ---------------------------------------------------------------------------
// deactivateCommissionRuleAction
// ---------------------------------------------------------------------------

export async function deactivateCommissionRuleAction(
  ruleId: string
): Promise<TierActionState> {
  const actor = await getRequiredAdmin();
  try {
    await deactivateCommissionRule(ruleId, {
      db: prisma as unknown as TierDb,
      actor,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to deactivate rule.",
    };
  }
}
