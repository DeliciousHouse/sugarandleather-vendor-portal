"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import {
  createDeal,
  updateDeal,
  type DealDb,
  type CreateDealInput,
  type UpdateDealInput,
} from "@/domain/deals/service";
import {
  stageCommissions,
  type CommissionDb,
  type StageCommissionsInput,
} from "@/domain/commissions/service";
import type { CommissionRuleSnapshot } from "@/domain/commissions/rules";

export type DealActionState = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Commission staging port — wires domain services together
// ---------------------------------------------------------------------------

async function buildStageCommissionsPort(
  dealId: string
): Promise<(input: {
  dealId: string;
  partnerId: string;
  productCode: string;
  packageCode: string | null;
  amountCents: number;
  currency: string;
  closedAt: Date;
}) => Promise<void>> {
  return async (portInput) => {
    // Look up partner tier
    const partner = await (prisma as unknown as {
      partner: {
        findUnique: (args: {
          where: { id: string };
          include: { tier: { select: { name: boolean } } };
        }) => Promise<{ tierId: string; tier: { name: string } } | null>;
      };
    }).partner.findUnique({
      where: { id: portInput.partnerId },
      include: { tier: { select: { name: true } } },
    });

    if (!partner) {
      throw new Error(`Partner not found: ${portInput.partnerId}`);
    }

    // Find active commission rules for this product/tier
    const rules = await (prisma as unknown as {
      commissionRule: {
        findMany: (args: {
          where: {
            tierId: string;
            productCode: string;
            isActive: boolean;
          };
        }) => Promise<
          Array<{
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
          }>
        >;
      };
    }).commissionRule.findMany({
      where: {
        tierId: partner.tierId,
        productCode: portInput.productCode,
        isActive: true,
      },
    });

    const ruleSnapshots: CommissionRuleSnapshot[] = rules.map((r) => ({
      id: r.id,
      tierId: r.tierId,
      tierName: partner.tier.name,
      productCode: r.productCode,
      packageCode: r.packageCode,
      kind: r.kind as "UPFRONT" | "TRAILING",
      percentBps: r.percentBps,
      flatAmountCents: r.flatAmountCents,
      currency: r.currency,
      trailingMonths: r.trailingMonths,
      payoutDelayDays: r.payoutDelayDays,
    }));

    const stageInput: StageCommissionsInput = {
      ...portInput,
      rules: ruleSnapshots,
    };

    await stageCommissions(stageInput, {
      db: prisma as unknown as CommissionDb,
      actor: { type: "SYSTEM" },
    });
  };
}

// ---------------------------------------------------------------------------
// createDealAction
// ---------------------------------------------------------------------------

export async function createDealAction(
  input: CreateDealInput
): Promise<DealActionState> {
  const actor = await getRequiredAdmin();

  try {
    await createDeal(input, {
      db: prisma as unknown as DealDb,
      actor,
      stageCommissions: await buildStageCommissionsPort(input.referralId),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create deal.",
    };
  }
}

// ---------------------------------------------------------------------------
// updateDealStatusAction
// ---------------------------------------------------------------------------

export async function updateDealStatusAction(
  input: UpdateDealInput
): Promise<DealActionState> {
  const actor = await getRequiredAdmin();

  try {
    await updateDeal(input, {
      db: prisma as unknown as DealDb,
      actor,
      stageCommissions: await buildStageCommissionsPort(input.dealId),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update deal.",
    };
  }
}
