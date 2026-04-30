"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export type ReferralFormData = {
  leadName: string;
  leadEmail?: string;
  leadCompany?: string;
  leadDomain?: string;
  country?: string;
  notes?: string;
};

type Props = {
  onSubmit: (data: ReferralFormData) => Promise<void>;
};

type FormErrors = {
  leadName?: string;
  contactMethod?: string;
};

function validate(data: ReferralFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.leadName.trim()) {
    errors.leadName = "Lead name is required";
  }
  if (!data.leadEmail?.trim() && !data.leadDomain?.trim()) {
    errors.contactMethod = "Email or company domain is required";
  }
  return errors;
}

export default function ReferralForm({ onSubmit }: Props) {
  const [form, setForm] = useState<ReferralFormData>({
    leadName: "",
    leadEmail: "",
    leadCompany: "",
    leadDomain: "",
    country: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--sl-silver)",
          padding: "0.75rem 1rem",
          backgroundColor: "var(--surface-panel)",
          border: "1px solid var(--border-dark)",
          borderRadius: "0.5rem",
        }}
      >
        Referrals are only counted after admin approval. Once submitted, referrals cannot be edited.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="leadName"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--sl-cream)" }}
        >
          Lead name <span aria-hidden="true" style={{ color: "var(--status-danger-text)" }}>*</span>
        </label>
        <input
          id="leadName"
          name="leadName"
          type="text"
          value={form.leadName}
          onChange={handleChange}
          autoComplete="off"
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.9375rem",
          }}
        />
        {errors.leadName && (
          <span role="alert" style={{ fontSize: "0.8125rem", color: "var(--status-danger-text)" }}>
            {errors.leadName}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="leadEmail"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--sl-cream)" }}
        >
          Lead email
        </label>
        <input
          id="leadEmail"
          name="leadEmail"
          type="email"
          value={form.leadEmail}
          onChange={handleChange}
          autoComplete="off"
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.9375rem",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="leadCompany"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--sl-cream)" }}
        >
          Company
        </label>
        <input
          id="leadCompany"
          name="leadCompany"
          type="text"
          value={form.leadCompany}
          onChange={handleChange}
          autoComplete="off"
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.9375rem",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="leadDomain"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--sl-cream)" }}
        >
          Company domain
        </label>
        <input
          id="leadDomain"
          name="leadDomain"
          type="text"
          value={form.leadDomain}
          onChange={handleChange}
          placeholder="example.com"
          autoComplete="off"
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.9375rem",
          }}
        />
        {errors.contactMethod && (
          <span role="alert" style={{ fontSize: "0.8125rem", color: "var(--status-danger-text)" }}>
            {errors.contactMethod}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="country"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--sl-cream)" }}
        >
          Country
        </label>
        <input
          id="country"
          name="country"
          type="text"
          value={form.country}
          onChange={handleChange}
          autoComplete="off"
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.9375rem",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="notes"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--sl-cream)" }}
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          style={{
            backgroundColor: "var(--surface-panel)",
            border: "1px solid var(--border-dark)",
            borderRadius: "0.375rem",
            padding: "0.5rem 0.75rem",
            color: "var(--sl-cream)",
            fontSize: "0.9375rem",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit referral"}
        </Button>
      </div>
    </form>
  );
}
