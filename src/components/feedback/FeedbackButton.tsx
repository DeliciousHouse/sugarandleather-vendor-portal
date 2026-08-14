"use client";

import { type FormEvent, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import {
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_IMPACT_OPTIONS,
  FEEDBACK_LIMITS,
  type FeedbackCategory,
  type FeedbackImpact,
} from "@/lib/feedback/options";

const initialForm: {
  category: FeedbackCategory;
  impact: FeedbackImpact | "";
  title: string;
  description: string;
} = {
  category: "bug",
  impact: "",
  title: "",
  description: "",
};

const fieldClassName =
  "mt-2 w-full rounded-sm border border-[var(--border-dark)] bg-[var(--surface-root)] px-3 py-2.5 text-sm text-[var(--text-primary-dark)] placeholder:text-[var(--text-secondary-dark)]";

type FeedbackField = "impact" | "title" | "description";
type FeedbackFieldErrors = Partial<Record<FeedbackField, string>>;

export default function FeedbackButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const impactRef = useRef<HTMLSelectElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const submissionIdRef = useRef("");
  const submittingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FeedbackFieldErrors>({});
  const [sentIssueKey, setSentIssueKey] = useState("");
  const [form, setForm] = useState(initialForm);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    setError("");
    setFieldErrors({});
    dialog.showModal();
    setIsOpen(true);
    titleRef.current?.focus();
  }

  function closeDialog() {
    if (submittingRef.current) return;
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setIsOpen(false);
    if (sentIssueKey) {
      setForm(initialForm);
      setSentIssueKey("");
      setError("");
      setFieldErrors({});
    }
  }

  function clearFieldError(field: FeedbackField) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextFieldErrors: FeedbackFieldErrors = {};
    if (!form.impact) {
      nextFieldErrors.impact = "Choose how much this affects you.";
    }
    if (!form.title.trim()) {
      nextFieldErrors.title = "Give your report a short title.";
    }
    if (!form.description.trim()) {
      nextFieldErrors.description = "Describe what happened.";
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      if (nextFieldErrors.impact) impactRef.current?.focus();
      else if (nextFieldErrors.title) titleRef.current?.focus();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    const submissionId =
      submissionIdRef.current || globalThis.crypto.randomUUID();
    submissionIdRef.current = submissionId;

    try {
      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          category: form.category,
          impact: form.impact,
          title: form.title.trim(),
          description: form.description.trim(),
          page_path: window.location.pathname,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        issue_key?: unknown;
      } | null;
      if (
        !response.ok ||
        typeof body?.issue_key !== "string" ||
        !/^GEN-\d+$/.test(body.issue_key)
      ) {
        throw new Error("Feedback submission failed");
      }

      setSentIssueKey(body.issue_key);
      submissionIdRef.current = "";
    } catch {
      setError("Feedback could not be submitted. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] min-h-11 shadow-lg hover:opacity-90 sm:right-6 sm:bottom-6"
        style={{ backgroundColor: "var(--surface-root)" }}
        aria-label="Send feedback"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openDialog}
      >
        Feedback
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="feedback-dialog-title"
        aria-describedby="feedback-dialog-description"
        onClose={handleDialogClose}
        onCancel={(event) => {
          if (submittingRef.current) event.preventDefault();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-sm border border-[var(--border-dark)] bg-[var(--surface-panel)] p-0 text-[var(--text-primary-dark)] shadow-2xl backdrop:bg-[var(--surface-root)] backdrop:opacity-80"
      >
        <div className="border-b border-[var(--border-dark)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--accent)] uppercase">
                Vendor Portal
              </p>
              <h2
                id="feedback-dialog-title"
                className="mt-1 font-heading text-3xl font-semibold"
              >
                Send feedback
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close feedback"
              disabled={submitting}
              onClick={closeDialog}
              className="min-h-11 min-w-11 rounded-sm text-2xl text-[var(--text-secondary-dark)] hover:bg-[var(--surface-panel-hover)] hover:text-[var(--text-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
            >
              ×
            </button>
          </div>
          <p
            id="feedback-dialog-description"
            className="mt-3 text-sm leading-6 text-[var(--text-secondary-dark)]"
          >
            Tell us what happened. We share only this report and the current page
            path—never screenshots, account details, or browser history.
          </p>
        </div>

        {sentIssueKey ? (
          <div className="px-5 py-6 sm:px-6">
            <p role="status" className="text-sm text-[var(--status-success-text)]">
              Feedback sent as {sentIssueKey}.
            </p>
            <Button type="button" className="mt-6 w-full" onClick={closeDialog}>
              Close
            </Button>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={submit}
            className="space-y-5 px-5 py-6 sm:px-6"
          >
            <div>
              <label htmlFor="feedback-category" className="block text-sm font-medium">
                Feedback type
              </label>
              <select
                id="feedback-category"
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value as FeedbackCategory,
                  })
                }
                className={fieldClassName}
              >
                {FEEDBACK_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-impact" className="block text-sm font-medium">
                How much does this affect you?
              </label>
              <select
                id="feedback-impact"
                ref={impactRef}
                required
                value={form.impact}
                aria-invalid={Boolean(fieldErrors.impact)}
                aria-describedby={fieldErrors.impact ? "feedback-impact-error" : undefined}
                onChange={(event) => {
                  setForm({
                    ...form,
                    impact: event.target.value as FeedbackImpact,
                  });
                  clearFieldError("impact");
                }}
                className={fieldClassName}
              >
                <option value="" disabled>
                  Select impact
                </option>
                {FEEDBACK_IMPACT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldErrors.impact ? (
                <span
                  id="feedback-impact-error"
                  className="mt-2 block text-sm text-[var(--status-danger-text)]"
                >
                  {fieldErrors.impact}
                </span>
              ) : null}
            </div>

            <div>
              <label htmlFor="feedback-title" className="block text-sm font-medium">
                Short title
              </label>
              <input
                id="feedback-title"
                ref={titleRef}
                required
                maxLength={FEEDBACK_LIMITS.titleMax}
                value={form.title}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? "feedback-title-error" : undefined}
                onChange={(event) => {
                  setForm({ ...form, title: event.target.value });
                  clearFieldError("title");
                }}
                placeholder="What needs attention?"
                className={fieldClassName}
              />
              {fieldErrors.title ? (
                <span
                  id="feedback-title-error"
                  className="mt-2 block text-sm text-[var(--status-danger-text)]"
                >
                  {fieldErrors.title}
                </span>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="feedback-description"
                className="block text-sm font-medium"
              >
                What happened?
              </label>
              <textarea
                id="feedback-description"
                required
                rows={5}
                maxLength={FEEDBACK_LIMITS.descriptionMax}
                value={form.description}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description ? "feedback-description-error" : undefined
                }
                onChange={(event) => {
                  setForm({ ...form, description: event.target.value });
                  clearFieldError("description");
                }}
                placeholder="Include what you expected and what happened instead."
                className={`${fieldClassName} resize-y`}
              />
              {fieldErrors.description ? (
                <span
                  id="feedback-description-error"
                  className="mt-2 block text-sm text-[var(--status-danger-text)]"
                >
                  {fieldErrors.description}
                </span>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="text-sm text-[var(--status-danger-text)]">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full min-h-11">
              {submitting ? "Sending…" : "Submit feedback"}
            </Button>
          </form>
        )}
      </dialog>
    </>
  );
}
