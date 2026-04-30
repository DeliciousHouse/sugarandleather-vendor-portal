"use server";

import { prisma } from "@/lib/prisma";
import { submitApplication } from "@/domain/applications/service";
import type { ApplicationFormState } from "@/components/applications/ApplicationForm";

export async function submitApplicationAction(
  _prevState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  try {
    const promotionChannels = formData.getAll("promotionChannels") as string[];

    const input = {
      fullName: (formData.get("fullName") as string | null) ?? "",
      email: (formData.get("email") as string | null) ?? "",
      phone: (formData.get("phone") as string | null) ?? undefined,
      company: (formData.get("company") as string | null) ?? undefined,
      country: (formData.get("country") as string | null) ?? "",
      promotionChannels,
      aiTechExperience:
        (formData.get("aiTechExperience") as string | null) ?? "",
      audience: (formData.get("audience") as string | null) ?? "",
      subjectiveAnswers: {
        whyPartner: (formData.get("whyPartner") as string | null) ?? "",
        promotionStrategy:
          (formData.get("promotionStrategy") as string | null) ?? "",
        audienceFit: (formData.get("audienceFit") as string | null) ?? "",
      },
    };

    await submitApplication(input, prisma);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}
