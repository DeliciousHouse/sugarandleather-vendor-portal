import React from "react";
import EditorialPageShell from "@/components/brand/EditorialPageShell";
import ApplicationForm from "@/components/applications/ApplicationForm";
import { submitApplicationAction } from "./actions";

export const metadata = {
  title: "Apply · Partner program · Sugar & Leather",
  description:
    "Apply to the Sugar & Leather AI affiliate and vendor partner program.",
};

export default function ApplyPage() {
  return (
    <EditorialPageShell
      sectionLabel="01 / Apply"
      eyebrow="Partner program"
      headline={
        <>
          Partner with{" "}
          <span className="relative inline-block">
            us
            <span
              aria-hidden
              className="absolute -bottom-2 left-0 h-[3px] w-full bg-[var(--sl-lavender)]"
            />
          </span>
        </>
      }
      subheadline="Reviewed by a person, not a funnel"
      mainChildren={
        <div className="max-w-2xl">
          <p className="mb-12 max-w-xl font-body text-base leading-relaxed text-[var(--sl-silver)]">
            We work with consultants, educators, content creators, and advisors
            who share our belief that AI should feel human. If that sounds like
            you, the form below is the only step. Every application is read by
            our team. We respond to fits within 5–7 business days.
          </p>
          <ApplicationForm action={submitApplicationAction} />
        </div>
      }
    />
  );
}
