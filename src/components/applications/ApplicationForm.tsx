"use client";

import { useActionState } from "react";
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
    formData: FormData
  ) => Promise<ApplicationFormState>;
}

function SuccessView() {
  return (
    <div
      className="rounded-xl border p-10 text-center"
      style={{
        backgroundColor: "var(--surface-panel)",
        borderColor: "var(--border-dark)",
      }}
    >
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-full mb-6"
        style={{ backgroundColor: "var(--accent-bg-subtle)" }}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--sl-lavender)" }}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: "var(--font-heading)", color: "var(--sl-cream)" }}
      >
        Application submitted
      </h2>
      <p
        className="mb-2 max-w-md mx-auto"
        style={{ color: "var(--sl-silver)" }}
      >
        Thank you for applying to the Sugar &amp; Leather partner program.
      </p>
      <p
        className="text-sm max-w-md mx-auto"
        style={{ color: "var(--sl-mid-gray)" }}
      >
        Our team reviews every application manually. If your application is a
        good fit, we will reach out within 5&ndash;7 business days with next
        steps. You will not receive an automated confirmation email.
      </p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-semibold mb-4 pb-2 border-b"
      style={{
        fontFamily: "var(--font-heading)",
        color: "var(--sl-cream)",
        borderColor: "var(--border-dark)",
      }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium"
        style={{ color: "var(--sl-silver)" }}
      >
        {label}
        {required && (
          <span
            className="ml-1"
            style={{ color: "var(--sl-lavender)" }}
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--sl-obsidian)",
  color: "var(--sl-cream)",
  border: "1px solid var(--border-dark)",
  borderRadius: "6px",
  padding: "10px 12px",
  fontSize: "14px",
  width: "100%",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "96px",
};

export default function ApplicationForm({ action }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
  });

  if (state.success) {
    return <SuccessView />;
  }

  return (
    <form action={formAction} noValidate aria-label="Partner application form">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border p-4 mb-6 text-sm"
          style={{
            backgroundColor: "var(--status-danger-bg)",
            borderColor: "var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Section 1 — Personal information */}
        <section aria-labelledby="section-personal">
          <SectionHeading>
            <span id="section-personal">Personal information</span>
          </SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="fullName" required>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                style={inputStyle}
              />
            </Field>
            <Field label="Email address" htmlFor="email" required>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                style={inputStyle}
              />
            </Field>
            <Field label="Phone number" htmlFor="phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                style={inputStyle}
              />
            </Field>
          </div>
        </section>

        {/* Section 2 — Company and location */}
        <section aria-labelledby="section-company">
          <SectionHeading>
            <span id="section-company">Company and location</span>
          </SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company or organization" htmlFor="company">
              <input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                style={inputStyle}
              />
            </Field>
            <Field label="Country" htmlFor="country" required>
              <input
                id="country"
                name="country"
                type="text"
                required
                autoComplete="country-name"
                style={inputStyle}
              />
            </Field>
          </div>
        </section>

        {/* Section 3 — Promotion channels */}
        <section aria-labelledby="section-channels">
          <SectionHeading>
            <span id="section-channels">Promotion channels</span>
          </SectionHeading>
          <p className="text-sm mb-4" style={{ color: "var(--sl-mid-gray)" }}>
            Select all channels you use to reach your audience. Choose at least
            one.
          </p>
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            role="group"
            aria-label="Promotion channels"
          >
            {PROMOTION_CHANNEL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors"
                style={{
                  borderColor: "var(--border-dark)",
                  backgroundColor: "var(--sl-obsidian)",
                  color: "var(--sl-cream)",
                }}
              >
                <input
                  type="checkbox"
                  name="promotionChannels"
                  value={opt.value}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--sl-lavender)" }}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Section 4 — Experience and audience */}
        <section aria-labelledby="section-experience">
          <SectionHeading>
            <span id="section-experience">Experience and audience</span>
          </SectionHeading>
          <div className="flex flex-col gap-4">
            <Field
              label="AI and technology experience"
              htmlFor="aiTechExperience"
              required
            >
              <textarea
                id="aiTechExperience"
                name="aiTechExperience"
                required
                placeholder="Describe your background with AI, ML, or technology tools and platforms"
                style={textareaStyle}
              />
            </Field>
            <Field label="Your audience" htmlFor="audience" required>
              <textarea
                id="audience"
                name="audience"
                required
                placeholder="Who is your audience? Include size, industry, seniority, and why they care about AI"
                style={textareaStyle}
              />
            </Field>
          </div>
        </section>

        {/* Section 5 — Subjective questions */}
        <section aria-labelledby="section-questions">
          <SectionHeading>
            <span id="section-questions">A few more questions</span>
          </SectionHeading>
          <div className="flex flex-col gap-4">
            <Field
              label="Why do you want to partner with Sugar & Leather AI?"
              htmlFor="whyPartner"
              required
            >
              <textarea
                id="whyPartner"
                name="whyPartner"
                required
                placeholder="Tell us what draws you to our mission and products"
                style={textareaStyle}
              />
            </Field>
            <Field
              label="How do you plan to promote Aries AI?"
              htmlFor="promotionStrategy"
              required
            >
              <textarea
                id="promotionStrategy"
                name="promotionStrategy"
                required
                placeholder="Describe your strategy, content ideas, or outreach approach"
                style={textareaStyle}
              />
            </Field>
            <Field
              label="Why is your audience a good fit for Aries AI?"
              htmlFor="audienceFit"
              required
            >
              <textarea
                id="audienceFit"
                name="audienceFit"
                required
                placeholder="Explain the alignment between what your audience needs and what Aries AI delivers"
                style={textareaStyle}
              />
            </Field>
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end">
        <Button type="submit" variant="primary" size="lg" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}
