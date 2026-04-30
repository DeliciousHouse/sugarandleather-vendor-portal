"use client";

import React from "react";
import { useActionState } from "react";
import EditorialField from "@/components/brand/EditorialField";
import Button from "@/components/ui/Button";

export type ApplicationFormState = {
  success: boolean;
  error?: string;
};

const PROMOTION_CHANNEL_OPTIONS = [
  { value: "blog", label: "Blog / Written content" },
  { value: "youtube", label: "YouTube / Video" },
  { value: "podcast", label: "Podcast" },
  { value: "social_media", label: "Social media" },
  { value: "newsletter", label: "Newsletter / Email list" },
  { value: "community", label: "Online community / Forum" },
  { value: "events", label: "Events / Conferences / Speaking" },
  { value: "consulting", label: "Consulting / Advisory" },
  { value: "other", label: "Other" },
];

interface ApplicationFormProps {
  action: (
    prevState: ApplicationFormState,
    formData: FormData,
  ) => Promise<ApplicationFormState>;
}

const inputClass =
  "w-full bg-transparent py-2 font-body text-base text-[var(--sl-cream)] placeholder:text-[var(--sl-silver)]/50 focus:outline-none";
const textareaClass = `${inputClass} min-h-24 resize-y`;

function SuccessView() {
  return (
    <div className="border-t border-[var(--sl-cream)] pt-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--sl-lavender)]">
        Submitted
      </p>
      <h2 className="mt-6 font-heading text-4xl text-[var(--sl-cream)] leading-[1.05]">
        Thank you.
      </h2>
      <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-[var(--sl-silver)]">
        Every application is read by a person on our team. If your work is a
        fit, we will reach out within 5–7 business days with next steps. There
        is no automated confirmation email.
      </p>
    </div>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-4 border-b border-[var(--border-dark)] pb-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--sl-silver)]">
        {index}
      </span>
      <h2 className="font-heading text-xl text-[var(--sl-cream)]">{label}</h2>
    </div>
  );
}

export default function ApplicationForm({ action }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });

  if (state.success) {
    return <SuccessView />;
  }

  return (
    <form action={formAction} noValidate aria-label="Partner application form">
      {state.error ? (
        <div
          role="alert"
          className="mb-8 border-l-2 border-[var(--status-danger-text)] pl-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--status-danger-text)]"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-12">
        <section aria-labelledby="section-personal">
          <SectionLabel index="01" label="Personal information" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <EditorialField label="Full name" htmlFor="fullName" required>
              <input
                name="fullName"
                type="text"
                required
                autoComplete="name"
                className={inputClass}
              />
            </EditorialField>
            <EditorialField label="Email address" htmlFor="email" required>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
              />
            </EditorialField>
            <EditorialField label="Phone number" htmlFor="phone">
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className={inputClass}
              />
            </EditorialField>
          </div>
        </section>

        <section aria-labelledby="section-company">
          <SectionLabel index="02" label="Company and location" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <EditorialField label="Company or organization" htmlFor="company">
              <input
                name="company"
                type="text"
                autoComplete="organization"
                className={inputClass}
              />
            </EditorialField>
            <EditorialField label="Country" htmlFor="country" required>
              <input
                name="country"
                type="text"
                required
                autoComplete="country-name"
                className={inputClass}
              />
            </EditorialField>
          </div>
        </section>

        <section aria-labelledby="section-channels">
          <SectionLabel index="03" label="Promotion channels" />
          <p className="mb-6 max-w-xl font-body text-sm text-[var(--sl-silver)]">
            Where do you reach your audience? Select every channel that
            applies.
          </p>
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            role="group"
            aria-label="Promotion channels"
          >
            {PROMOTION_CHANNEL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 border-t border-[var(--border-dark)] py-3 cursor-pointer transition-colors hover:bg-[var(--sl-charcoal)]/50"
              >
                <input
                  type="checkbox"
                  name="promotionChannels"
                  value={opt.value}
                  className="h-4 w-4 rounded-sm border border-[var(--border-dark)]"
                  style={{ accentColor: "var(--sl-cream)" }}
                />
                <span className="font-body text-sm text-[var(--sl-cream)]">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section aria-labelledby="section-experience">
          <SectionLabel index="04" label="Experience and audience" />
          <div className="flex flex-col gap-8">
            <EditorialField
              label="AI and technology experience"
              htmlFor="aiTechExperience"
              required
            >
              <textarea
                name="aiTechExperience"
                required
                placeholder="Your background with AI, ML, or technology tools"
                className={textareaClass}
              />
            </EditorialField>
            <EditorialField label="Your audience" htmlFor="audience" required>
              <textarea
                name="audience"
                required
                placeholder="Who they are, how many, why they care about AI"
                className={textareaClass}
              />
            </EditorialField>
          </div>
        </section>

        <section aria-labelledby="section-questions">
          <SectionLabel index="05" label="A few more questions" />
          <div className="flex flex-col gap-8">
            <EditorialField
              label="Why do you want to partner with Sugar & Leather AI?"
              htmlFor="whyPartner"
              required
            >
              <textarea
                name="whyPartner"
                required
                placeholder="What draws you to our mission and products"
                className={textareaClass}
              />
            </EditorialField>
            <EditorialField
              label="How do you plan to promote Aries AI?"
              htmlFor="promotionStrategy"
              required
            >
              <textarea
                name="promotionStrategy"
                required
                placeholder="Strategy, content ideas, outreach approach"
                className={textareaClass}
              />
            </EditorialField>
            <EditorialField
              label="Why is your audience a good fit for Aries AI?"
              htmlFor="audienceFit"
              required
            >
              <textarea
                name="audienceFit"
                required
                placeholder="The alignment between their needs and what we deliver"
                className={textareaClass}
              />
            </EditorialField>
          </div>
        </section>
      </div>

      <div className="mt-12 flex justify-end">
        <Button type="submit" variant="primary" size="lg" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}
