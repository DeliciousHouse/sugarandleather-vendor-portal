"use client";

import React, { useState } from "react";
import EditorialField from "@/components/brand/EditorialField";
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

const inputClass =
  "w-full bg-transparent py-2 font-body text-base text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:outline-none";

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <p className="border-t border-[var(--border-dark)] pt-4 font-body text-sm leading-relaxed text-[var(--sl-silver)]">
        Referrals are only counted after admin approval. Once submitted, they
        cannot be edited. Corrections happen through your admin contact.
      </p>

      <EditorialField
        label="Lead name"
        htmlFor="leadName"
        required
        error={errors.leadName}
      >
        <input
          name="leadName"
          type="text"
          value={form.leadName}
          onChange={handleChange}
          autoComplete="off"
          className={inputClass}
        />
      </EditorialField>

      <EditorialField label="Lead email" htmlFor="leadEmail">
        <input
          name="leadEmail"
          type="email"
          value={form.leadEmail}
          onChange={handleChange}
          autoComplete="off"
          className={inputClass}
        />
      </EditorialField>

      <EditorialField label="Company" htmlFor="leadCompany">
        <input
          name="leadCompany"
          type="text"
          value={form.leadCompany}
          onChange={handleChange}
          autoComplete="off"
          className={inputClass}
        />
      </EditorialField>

      <EditorialField
        label="Company domain"
        htmlFor="leadDomain"
        error={errors.contactMethod}
      >
        <input
          name="leadDomain"
          type="text"
          value={form.leadDomain}
          onChange={handleChange}
          placeholder="example.com"
          autoComplete="off"
          className={inputClass}
        />
      </EditorialField>

      <EditorialField label="Country" htmlFor="country">
        <input
          name="country"
          type="text"
          value={form.country}
          onChange={handleChange}
          autoComplete="off"
          className={inputClass}
        />
      </EditorialField>

      <EditorialField label="Notes" htmlFor="notes">
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </EditorialField>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit referral"}
        </Button>
      </div>
    </form>
  );
}
