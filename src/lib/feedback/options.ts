export const FEEDBACK_CATEGORIES = ["bug", "question", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_IMPACTS = [
  "p0_system_blocked",
  "p1_account_blocked",
  "p2_feature_degraded",
  "p3_minor_glitch",
  "p4_question",
] as const;
export type FeedbackImpact = (typeof FEEDBACK_IMPACTS)[number];

export const FEEDBACK_CATEGORY_OPTIONS: ReadonlyArray<{
  value: FeedbackCategory;
  label: string;
}> = [
  { value: "bug", label: "Bug" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
];

export const FEEDBACK_IMPACT_OPTIONS: ReadonlyArray<{
  value: FeedbackImpact;
  label: string;
}> = [
  { value: "p0_system_blocked", label: "Entire team/system is blocked" },
  { value: "p1_account_blocked", label: "My account is blocked, others are OK" },
  { value: "p2_feature_degraded", label: "A feature is degraded/broken" },
  { value: "p3_minor_glitch", label: "Minor glitch/cosmetic issue" },
  { value: "p4_question", label: "General question/feedback" },
];

export const FEEDBACK_LIMITS = {
  titleMax: 255,
  descriptionMax: 10_000,
  pagePathMax: 512,
} as const;
