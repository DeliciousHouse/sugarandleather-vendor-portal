"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredActivePartner } from "@/lib/auth";
import { submitReferral, type ReferralInput, type ReferralDb } from "@/domain/referrals/service";

export type SubmitReferralFormState =
  | { ok: true; referralId: string }
  | { ok: false; error: string };

export async function submitReferralAction(
  formData: FormData
): Promise<SubmitReferralFormState> {
  const actor = await getRequiredActivePartner();

  if (!actor.partnerId) {
    return { ok: false, error: "No partner record found for this account." };
  }

  const input: ReferralInput = {
    partnerId: actor.partnerId,
    leadName: (formData.get("leadName") as string | null) ?? "",
    leadEmail: (formData.get("leadEmail") as string | null) || undefined,
    leadCompany: (formData.get("leadCompany") as string | null) || undefined,
    leadDomain: (formData.get("leadDomain") as string | null) || undefined,
    country: (formData.get("country") as string | null) || undefined,
    notes: (formData.get("notes") as string | null) || undefined,
  };

  try {
    const referral = await submitReferral(input, {
      db: prisma as unknown as ReferralDb,
      actor: { id: actor.id, type: "USER" },
    });
    return { ok: true, referralId: referral.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit referral.",
    };
  }
}
