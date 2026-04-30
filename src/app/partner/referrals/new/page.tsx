"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ReferralForm, { type ReferralFormData } from "@/components/referrals/ReferralForm";
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-root)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--sl-cream)",
            marginBottom: "2rem",
          }}
        >
          Submit a referral
        </h1>

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              backgroundColor: "var(--status-danger-bg)",
              border: "1px solid var(--status-danger-border)",
              borderRadius: "0.5rem",
              color: "var(--status-danger-text)",
              fontSize: "0.9375rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        <ReferralForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
