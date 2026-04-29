"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import { reviewReferral, type ReviewDb } from "@/domain/referrals/service";

export type ReviewActionState =
  | { ok: true }
  | { ok: false; error: string };

export async function approveReferralAction(
  referralId: string,
  adminNotes?: string
): Promise<ReviewActionState> {
  const actor = await getRequiredAdmin();

  try {
    await reviewReferral(
      {
        referralId,
        action: "APPROVE",
        adminNotes: adminNotes || null,
        reviewedById: actor.id,
      },
      {
        db: prisma as unknown as ReviewDb,
        actor: { id: actor.id, type: "USER" },
      }
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to approve referral.",
    };
  }
}

export async function rejectReferralAction(
  referralId: string,
  adminNotes?: string
): Promise<ReviewActionState> {
  const actor = await getRequiredAdmin();

  try {
    await reviewReferral(
      {
        referralId,
        action: "REJECT",
        adminNotes: adminNotes || null,
        reviewedById: actor.id,
      },
      {
        db: prisma as unknown as ReviewDb,
        actor: { id: actor.id, type: "USER" },
      }
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reject referral.",
    };
  }
}
