"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import { getEmailAdapter } from "@/lib/email";
import {
  sendAgreementPacket,
  markAgreementSigned,
  activatePartnerFromSignedAgreement,
} from "@/domain/agreements/service";

export async function sendAgreementPacketAction(
  applicationId: string
): Promise<{ error?: string }> {
  try {
    const actor = await getRequiredAdmin();
    const email = getEmailAdapter();
    await sendAgreementPacket(applicationId, actor, prisma, email);
    revalidatePath("/admin/agreements");
    revalidatePath(`/admin/applications/${applicationId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function markAgreementSignedAction(
  agreementId: string,
  signedEvidenceUrl: string | undefined,
  signedEvidenceNote: string | undefined
): Promise<{ error?: string }> {
  try {
    const actor = await getRequiredAdmin();
    await markAgreementSigned(
      agreementId,
      { signedEvidenceUrl, signedEvidenceNote },
      actor,
      prisma
    );
    revalidatePath("/admin/agreements");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function activatePartnerAction(
  agreementId: string
): Promise<{ error?: string }> {
  try {
    const actor = await getRequiredAdmin();
    const email = getEmailAdapter();
    await activatePartnerFromSignedAgreement(agreementId, actor, prisma, email);
    revalidatePath("/admin/agreements");
    revalidatePath("/admin/applications");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unexpected error" };
  }
}
