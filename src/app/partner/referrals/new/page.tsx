"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import ReferralForm, {
  type ReferralFormData,
} from "@/components/referrals/ReferralForm";
import { submitReferralAction } from "../actions";

export default function NewReferralPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(data: ReferralFormData) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value != null) formData.set(key, value);
    }
    const result = await submitReferralAction(formData);
    if (result.ok) {
      router.push("/partner/referrals");
    } else {
      setErrorMessage(result.error);
    }
  }

  return (
    <EditorialPageShell
      sectionLabel="03 / New referral"
      crumbs={[
        { label: "Referrals", href: "/partner/referrals" },
        { label: "New" },
      ]}
      eyebrow="Submit a referral"
      headline={
        <>
          One lead.
          <br />
          One submission.
        </>
      }
      subheadline="Approved within 2-3 business days"
      mainChildren={
        <div className="max-w-2xl">
          {errorMessage ? (
            <div
              role="alert"
              className="mb-8 border-l-2 border-[var(--status-danger-text)] pl-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--status-danger-text)]"
            >
              {errorMessage}
            </div>
          ) : null}
          <ReferralForm onSubmit={handleSubmit} />
        </div>
      }
    />
  );
}
