"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import {
  markInReview,
  rejectApplication,
  approvePendingAgreement,
} from "@/domain/applications/service";

export async function markInReviewAction(applicationId: string): Promise<{ error?: string }> {
  try {
    const actor = await getRequiredAdmin();
    await markInReview(applicationId, actor, prisma);
    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath("/admin/applications");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function rejectApplicationAction(
  applicationId: string,
  notes: string
): Promise<{ error?: string }> {
  try {
    const actor = await getRequiredAdmin();
    await rejectApplication(applicationId, notes, actor, prisma);
    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath("/admin/applications");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

export async function approvePendingAgreementAction(
  applicationId: string,
  notes: string | undefined
): Promise<{ error?: string }> {
  try {
    const actor = await getRequiredAdmin();
    await approvePendingAgreement(applicationId, notes, actor, prisma);
    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath("/admin/applications");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unexpected error" };
  }
}
